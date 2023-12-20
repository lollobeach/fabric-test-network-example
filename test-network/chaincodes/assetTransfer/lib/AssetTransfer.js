'use strict';

const { Contract } = require('fabric-contract-api')

class AssetTransfer extends Contract {

    async initLedger(ctx) {
       
        }
    

    // CreateAsset issues a new asset to the world state with given details.
    async createAsset(ctx, id, color, size, owner, appraisedValue) {
        
    }



    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async updateAsset(ctx, id, color, size, owner, appraisedValue) {
	
    }

    // DeleteAsset deletes an given asset from the world state.
    async deleteAsset(ctx, id) {
        
    }



    // TransferAsset updates the owner field of asset with given id in the world state.
    async transferAsset(ctx, id, newOwner) {
       
    }

    // GetAllAssets returns all assets found in the world state.
    async getAllAssets(ctx) {
        
    }

}

module.exports = AssetTransfer