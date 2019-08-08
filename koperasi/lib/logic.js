'use strict';
/**
 * Write your transction processor functions here
 */

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
    var account1 = factory.newResource(NS, 'Account', savingId);
    account1.owner = factory.newRelationship(NS, 'User', userId);
    account1.balance = 0;
    account1.type = 'SAVING';
    account1.lastUpdate = newUser.timestamp;

    // Create loan account
    var account2 = factory.newResource(NS, 'Account', loanId);
    account2.owner = factory.newRelationship(NS, 'User', userId);
    account2.balance = 0;
    account2.type = 'LOAN';
    account2.lastUpdate = newUser.timestamp;

    // Commit change

    return getParticipantRegistry(NS + '.User')
        .then(function(userRegistry){
            return userRegistry.addAll([user]);
        })
        .then(function(){
            return getAssetRegistry(NS + '.Account');
        })
        .then(function(accountRegistry){
            return accountRegistry.addAll([account1, account2]);
        });
}

/**
 * Create a account transaction
 * @param {com.daussho.koperasi.AccountTransaction} accountTransaction
 * @transaction
 */

function accountTransaction(tx){

    var NS = 'com.daussho.koperasi.Account';
    var account = tx.account;

    // Check if account is TABUNGAN
    if (account.type === 'SAVING'){
        if (tx.type === 'DEPOSIT'){ //Check if transaction is SETOR
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
    
        } else if (tx.type === 'WITHDRAWAL'){ // Check if transaction is TARIK
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
        }
    } else if (account.type === 'LOAN'){

    }
    
    // Commit change
    return getAssetRegistry(NS)
        .then(function(accountRegistry){
            accountRegistry.update(account);
        });
}