/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */



// import * as grpc from '@grpc/grpc-js';
const grpc = require('@grpc/grpc-js')
// import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
const { connect, Contract, Identity, Signer, signers } = require('@hyperledger/fabric-gateway')
const { Console } = require('console')
// import * as crypto from 'crypto';
const crypto = require('crypto')
// import { promises as fs } from 'fs';
const fs = require('fs')
// import * as path from 'path';
const path = require('path')
const { TextDecoder } = require('util')

const channelName = envOrDefault('CHANNEL_NAME', 'q1channel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'assetTransfer');
const mspId = envOrDefault('MSP_ID', 'AgencyMSP');

// Path to crypto materials.
const cryptoPath = '/workspaces/fabric-test-network-example/test-network/organizations/peerOrganizations/agency.quotation.com/';
// const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'agency.quotation.com'));

// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@agency.quotation.com', 'msp', 'keystore'));

// Path to user certificate.
const certPath = cryptoPath + '/users/User1@agency.quotation.com/msp/signcerts/User1@agency.quotation.com-cert.pem'

// Path to peer tls certificate.
const tlsCertPath = cryptoPath + 'peers/peer0.agency.quotation.com/tls/ca.crt';

// Gateway peer endpoint.
const peerEndpoint = 'jubilant-space-happiness-rv5q5794v6wcxqp7-11051.app.github.dev/'

// Gateway peer SSL host name override.
const peerHostAlias = 'peer0.agency.quotation.com'

const utf8Decoder = new TextDecoder();
const assetId = `asset${Date.now()}`;

async function main() {

    await displayInputParameters();

    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });

    try {
        // Get a network instance representing the channel where the smart contract is deployed.
        const network = gateway.getNetwork(channelName);

        // Get the smart contract from the network.
        const contract = network.getContract(chaincodeName);

        // Initialize a set of asset data on the ledger using the chaincode 'InitLedger' function.
        await initLedger(contract);

        // Return all the current assets on the ledger.
        await getAllAssets(contract);

        // Create a new asset on the ledger.
        await createAsset(contract);

        // Update an existing asset asynchronously.
        await transferAssetAsync(contract);

        // Get the asset details by assetID.
        await readAssetByID(contract);

        // Update an asset which does not exist.
        await updateNonExistentAsset(contract)
    } finally {
        gateway.close();
        client.close();
    }
}

// main().catch(error => {
//     console.error('******** FAILED to run the application:', error);
//     process.exitCode = 1;
// });

async function newGrpcConnection() {
    const tlsRootCert = fs.readFileSync(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

function newIdentity() {
    const credentials = fs.readFileSync(certPath)
    return { mspId, credentials}
    // fs.readFile(certPath, (err, data) => {
    //     if (err) {
    //         console.log("ERROR")
    //         console.error(err)
    //     } else {
    //         console.log("IDENTITY CREATED")
    //         console.log()
    //         return { mspId, data }
    //     }

    // })
}

function newSigner() {
    const files = fs.readdirSync(keyDirectoryPath)
    const keyPath = path.resolve(keyDirectoryPath, files[0])
    const privateKeyPem = fs.readFileSync(keyPath)
    const privateKey = crypto.createPrivateKey(privateKeyPem)
    return signers.newPrivateKeySigner(privateKey)

    // fs.readdir(keyDirectoryPath, (err, files) => {
    //     console.log("Files: ", files)
    //     if (err) throw err
    //     const keyPath = path.resolve(keyDirectoryPath, files[0])
    //     console.log("KeyPath: ", keyPath)
    //     fs.readFile(keyPath, (error, privateKeyPem) => {
    //         console.log("privateKeyPem: ", privateKeyPem)
    //         if (error) throw error
    //         const privateKey = crypto.createPrivateKey(privateKeyPem)
    //         console.log("PrivateKey: ", privateKey)
    //         const prk = signers.newPrivateKeySigner(privateKey)
    //         console.log(prk)
    //         return prk;
    //     })
    // });
}

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
async function submitT(channel, transactionName, transactionParams) {
    console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, Color, Size, Owner and AppraisedValue arguments');

    const client = await newGrpcConnection()
    console.log("gRPC Connection created")

    const id = newIdentity()
    const signer = newSigner()
    console.log(signer)

    const gateway = connect({
        client,
        identity: id,
        signe: signer,
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    })

    console.log("Transaction Name: ", transactionName)
    console.log("Transaction params: ", ...transactionParams)
    try {
        console.log("Connecting to the channel...")
        const network = gateway.getNetwork(channel)
        console.log("Getting the contract...")
        const contract = await network.getContract('assetTransfer')

        let resp = null
        if (!transactionParams || transactionParams === '') {
            resp = await contract.submitTransaction(transactionName)
        } else {
            resp = await contract.submitTransaction(transactionName, ...transactionParams)
        }

        console.log(resp.toString())

    } catch (err) {
        console.error(err)
    } finally {
        gateway.close()
        client.close()
    }

    // await contract.submitTransaction(
    //     'CreateAsset',
    //     assetId,
    //     'yellow',
    //     '5',
    //     'Tom',
    //     '1300',
    // );

    console.log('*** Transaction committed successfully');
}


/**
 * This type of transaction would typically only be run once by an application the first time it was started after its
 * initial deployment. A new version of the chaincode deployed later would likely not need to run an "init" function.
 */
async function initLedger(contract) {
    console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');

    await contract.submitTransaction('InitLedger');

    console.log('*** Transaction committed successfully');
}

/**
 * Evaluate a transaction to query ledger state.
 */
async function getAllAssets(contract) {
    console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');

    const resultBytes = await contract.evaluateTransaction('GetAllAssets');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}

/**
 * Submit transaction asynchronously, allowing the application to process the smart contract response (e.g. update a UI)
 * while waiting for the commit notification.
 */
async function transferAssetAsync(contract) {
    console.log('\n--> Async Submit Transaction: TransferAsset, updates existing asset owner');

    const commit = await contract.submitAsync('TransferAsset', {
        arguments: [assetId, 'Saptha'],
    });
    const oldOwner = utf8Decoder.decode(commit.getResult());

    console.log(`*** Successfully submitted transaction to transfer ownership from ${oldOwner} to Saptha`);
    console.log('*** Waiting for transaction commit');

    const status = await commit.getStatus();
    if (!status.successful) {
        throw new Error(`Transaction ${status.transactionId} failed to commit with status code ${status.code}`);
    }

    console.log('*** Transaction committed successfully');
}

async function readAssetByID(contract) {
    console.log('\n--> Evaluate Transaction: ReadAsset, function returns asset attributes');

    const resultBytes = await contract.evaluateTransaction('ReadAsset', assetId);

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}

/**
 * submitTransaction() will throw an error containing details of any error responses from the smart contract.
 */
async function updateNonExistentAsset(contract) {
    console.log('\n--> Submit Transaction: UpdateAsset asset70, asset70 does not exist and should return an error');

    try {
        await contract.submitTransaction(
            'UpdateAsset',
            'asset70',
            'blue',
            '5',
            'Tomoko',
            '300',
        );
        console.log('******** FAILED to return an error');
    } catch (error) {
        console.log('*** Successfully caught the error: \n', error);
    }
}

/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}

/**
 * displayInputParameters() will print the global scope parameters used by the main driver routine.
 */
async function displayInputParameters() {
    console.log(`channelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certPath:          ${certPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}

module.exports = { submitT }