'use strict';

const { Contract } = require('fabric-contract-api')

class AssetTransfer extends Contract {

    async initLedger(ctx) {
        const asset = {
                ID: 'asset1',
                Color: 'blue',
                Size: 5,
                Owner: 'Tomoko',
                AppraisedValue: 300,
            };
            
            // example of how to write to world state deterministically
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
        }
    

    // CreateAsset issues a new asset to the world state with given details.
    async createAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        
        const assetBuffer = Buffer.from(JSON.stringify(asset));
        ctx.stub.setEvent('CreateAsset', assetBuffer);

        await ctx.stub.putState(id, assetBuffer);
        return JSON.stringify(asset);
    }



    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async updateAsset(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const rawAsset = await ctx.stub.getState(id);
        const asset = JSON.parse(rawAsset.toString());
        asset.Color = color;
        asset.Size = size;
        asset.Owner = owner;
        asset.AppraisedValue = appraisedValue;
        const assetBuffer = Buffer.from(JSON.stringify(asset));
        ctx.stub.setEvent('UpdateAsset', assetBuffer);
        return ctx.stub.putState(id, assetBuffer);
    }

    // DeleteAsset deletes an given asset from the world state.
    async deleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
	    const asset = await ctx.stub.getState(id);
        const assetBuffer = Buffer.from(JSON.stringify(asset));
        ctx.stub.setEvent('DeleteAsset', assetBuffer);
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async transferAsset(ctx, id, newOwner) {
        const rawAsset = await ctx.stub.getState(id);
	    const asset = JSON.parse(rawAsset.toString());
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        const assetBuffer = Buffer.from(JSON.stringify(asset));

	    ctx.stub.setEvent('TransferAsset', assetBuffer);
        ctx.stub.putState(id, assetBuffer);
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async getAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}

module.exports = AssetTransfer