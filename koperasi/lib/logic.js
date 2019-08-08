/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Account transaction
 * @param {com.daussho.koperasi.CreateDemoUser} createDemoUser
 * @transaction
 */
function createDemoUser(demoUser) {
    
    var factory = getFactory();
    var NS = 'com.daussho.koperasi';

    var userId = '0';
    var accId = '0';
    
    // Create demo user for Anggota
    var user = factory.newResource(NS, 'User', userId);
    user.name = 'Demo User';
    user.address = 'Jl. Ganesha No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132';
    user.type = 'ANGGOTA';

    // Create account
    var account = factory.newResource(NS, 'Account', accId);
    account.owner = factory.newRelationship(NS, 'User', userId);
    account.balance = 0;
    account.type = 'TABUNGAN';
    account.lastUpdate = demoUser.timestamp;

    // Create transaction

    // Commit change

    return getParticipantRegistry(NS + '.User')
        .then(function(userRegistry){
            return userRegistry.addAll([user]);
        })
        .then(function(){
            return getAssetRegistry(NS + '.Account');
        })
        .then(function(accountRegistry){
            return accountRegistry.addAll([account]);
        });
}