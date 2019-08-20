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