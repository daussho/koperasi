'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Create a new user and account
 * @param {com.daussho.koperasi.CreateNewMember} createNewMember
 * @transaction
 */

function createNewMember(newUser){
    var factory = getFactory();
    var NS = 'com.daussho.koperasi';

    var userId = 'MEM_' + newUser.userId;
    var savingId = 'SAVE_' + newUser.userId;
    var loanId = 'LOAN_' + newUser.userId;
    
    // Create demo user for Anggota
    var user = factory.newResource(NS, 'User', userId);
    user.name = newUser.name;
    user.address = newUser.address;
    user.type = 'MEMBER';
    user.timeStamp = newUser.timestamp;

    // Create saving account
    var account1 = factory.newResource(NS, 'SavingAccount', savingId);
    account1.owner = factory.newRelationship(NS, 'User', userId);
    account1.balance = 0;
    account1.lastUpdate = newUser.timestamp;

    // Create loan account
    var account2 = factory.newResource(NS, 'LoanAccount', loanId);
    account2.owner = factory.newRelationship(NS, 'User', userId);
    account2.debt = 0;
    account2.lastUpdate = newUser.timestamp;

    // Commit change

    return getParticipantRegistry(NS + '.User')
        .then(function(userRegistry){
            return userRegistry.addAll([user]);
        })
        .then(function(){
            return getAssetRegistry(NS + '.SavingAccount');
        })
        .then(function(savingRegistry){
            return savingRegistry.addAll([account1]);
        })
        .then(function(){
            return getAssetRegistry(NS + '.LoanAccount');
        })
        .then(function(loanRegistry){
            return loanRegistry.addAll([account2]);
        })
}

/**
 * Create a demo user account
 * @param {com.daussho.koperasi.CreateDemoUser} createDemoUser
 * @transaction
 */

function createDemoUser(demoUser) {

    newUser = {
        "$class": "com.daussho.koperasi.CreateNewMember",
        "userId": "0",
        "name": "Demo Member",
        "address": "Jl. Ganesha No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132",
        "timestamp": demoUser.timestamp
    };

    return createNewMember(newUser);
}

/**
 * Create a saving transaction
 * @param {com.daussho.koperasi.SavingTransaction} savingTransaction
 * @transaction
 */

function savingTransaction(tx){

    var NS = 'com.daussho.koperasi.SavingAccount';
    var account = tx.account;

    // Check if transaction is withdrawal
    if (tx.type === 'WITHDRAWAL'){ 
        // Check tx amount
        if (tx.amount >= 0){
            throw new Error('Amount is zero or more');
        }

        // Check end balance
        if (account.balance + tx.amount < 0){
            throw new Error('Ending balance is less than zero');
        } else {
            account.accountTransaction.push(tx);
            account.balance += tx.amount;
        }
        account.lastUpdate = tx.timestamp;
    } else { //Check if transaction is deposit
        // Check if have match deposit type
        switch(tx.type) {
            case 'MAIN':
                account.lastMainSaving = tx.timestamp;
                break;
            case 'MANDATORY':
                account.lastMandatorySaving = tx.timestamp;
                break;
            case 'VOLUNTARY':
                account.lastVoluntarySaving = tx.timestamp;
                break;
            default:
                throw new Error('Deposit type not found!');
        }
          
        // Check tx amount
        if (tx.amount <= 0){
            throw new Error('Amount is zero or less');
        }

        // Add new transaction to account
        if (account.accountTransaction){
            account.accountTransaction.push(tx);
            account.balance += tx.amount;
        } else {
            account.accountTransaction = [tx];
            account.balance = tx.amount;
        }
        account.lastUpdate = tx.timestamp;

    }
    
    // Commit change
    return getAssetRegistry(NS)
        .then(function(accountRegistry){
            accountRegistry.update(account);
        });
}

/**
 * Create a loan transaction
 * @param {com.daussho.koperasi.LoanTransaction} loanTransaction
 * @transaction
 */

function loanTransaction(tx){
    
    var NS = 'com.daussho.koperasi.LoanAccount';
    var account = tx.account;
    var maxLoan = 1.25;
    var accountAge = 10;
    var fineFactor = 0.01;

    // Check if transaction is create loan
    if (tx.type === 'LOAN'){
        if (account.debt > 0) {
            throw new Error('You have unpaid debt!');
        }

        // Check account age
        var x = monthDiff(new Date(account.owner.timeStamp), new Date());
        if (x < accountAge){
            throw new Error('Account less than 10 months');
        }

        // Check saving account
        if (tx.savingAccount == null){
            throw new Error('Saving account not found!');
        }

        // Check loan amount
        if (tx.amount < 0){
            throw new Error('Loan must bigger than zero!');
        }
        
        // Check submitted loan amount
        var loan = tx.savingAccount.balance * maxLoan;
        if (tx.amount > loan){
            throw new Error('Loan is too big!');
        }

        // Check loan period
        if (tx.period <= 0){
            throw new Error('Period must be greater than zero!');
        }

        // Add new transaction to account
        if (account.accountTransaction){
            account.accountTransaction.push(tx);
        } else {
            account.accountTransaction = [tx];
        }
        account.debt = tx.amount;
        account.period = tx.period;
        account.installment = tx.amount/tx.period;
        account.lastUpdate = tx.timestamp;
    } else if(tx.type === 'PAYMENT'){
        
        var diff = (new Date() - new Date(account.lastUpdate))/(1000 * 60 * 60 * 24);
        var fine = 0;
        
        // Check if last payment is past 7 days
        if (diff > 7){
            fine = account.debt*fineFactor;
        }
        console.log(fine);

        if (tx.amount > 0){
            throw new Error('Amount must less than zero!');
        }

        var total = account.installment + fine;
        if (-1*tx.amount < total){
            throw new Error('Payment amount not enough! You must pay Rp '+ total);
        }

        if (((tx.amount + fine) + account.debt) < 0){
            throw new Error('Payment amount too much!');
        }

        account.accountTransaction.push(tx);
        account.debt += tx.amount + fine;
        account.period--;

        if (account.period == 0){
            account.installment = 0;
        } else {
            account.installment = account.debt/account.period;
        }
        account.lastUpdate = tx.timestamp;        
    }

    // Commit change
    return getAssetRegistry(NS)
    .then(function(accountRegistry){
        accountRegistry.update(account);
    });
}

function monthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();

    var dateDiff = d2.getDate() - d1.getDate();
    if (dateDiff < 0){
        months--;
    }
    return months;
}
