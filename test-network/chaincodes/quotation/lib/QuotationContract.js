'use strict';

const { Contract } = require('fabric-contract-api')

class QuotationContract extends Contract {

    async initLedger(ctx) {
        // example of quotation in requested state (initial state): 
        // the Agency has requested a quotation 
        const quotation = {
            ID: 'quotation1',
            Type: 'shoes', 
            Price: null,
            Issuer: null,
            Quantity: 100,
            State: 'requested' 
        }

        /**
         * Other quotation states: 
         * 'provided' state (intermediate state): 
         * the Supplier A or B has provided the quotation 
         * 
         * 'accepted' state (final state): 
         * the Agency has accepted the quotation of SupplierB
         * 
         * 'rejected' state (final state): 
         * the Agency has rejected the quotation of SupplierA
         */
        
        /**
         * pushing the quotation to the ledger
         * the putState function uses the quotation ID as key and
         * the quotation object as value to be stored
         */
        await ctx.stub.putState(quotation.ID, Buffer.from(JSON.stringify(quotation)))
        console.info(`INFO: Quotation ${quotation.ID} initialized`)
    }
    
    
  
    // Function for getting back a specific quotation from the ledger
    // quotationID: the id of the quotation to get
    async getQuotation(ctx, quotationID) {
        const quotation = await ctx.stub.getState(quotationID)
        if (!quotation || quotation.length === 0) {
            throw new Error(`The quotation ${quotationID} does not exist`)
        }
        console.info(`Quotation key:   ${quotation.ID}`)
        console.info(`Quotation value: ${quotation}`)

        ctx.stub.setEvent('getQuotation', quotation)
        return JSON.stringify(quotation.toString())
    }

    // Transaction submitter: Agency
    async requestQuotation(ctx, id, type, quantity) {
        const submitter = ctx.stub.getCreator().mspid

        if(!submitter.includes('Agency')) {
            throw new Error(`Only the agency can request a quotation`)
        }

        const newQuotation = {
            ID: id,
            Type: type,
            Price: null,
            Issuer: null,
            Quantity: quantity,
            State: 'requested'
        }

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(newQuotation)))
        console.info(`New quotation request ${newQuotation.ID} inserted`)
        return JSON.stringify(newQuotation)
    }

    // Transaction submitter: SupplierA or SupplierB
    async provideQuotation(ctx, id, newPrice) {
        const submitter = ctx.stub.getCreator().mspid
        if(!submitter.includes('Supplier')) {
    	    throw new Error(`Only the supplier can provide a quotation`)
        }
        const quotationBuffer = await ctx.stub.getState(id) 
   	    const quotationString = quotationBuffer.toString()	
        const quotation = JSON.parse(quotationString)		
        quotation.Price = newPrice
        quotation.Issuer = submitter					
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(quotation))) 
    }
    
    // Transaciton submitter: Agency
    async acceptQuotation(ctx, quotationID, newState) {
        const submitter = ctx.stub.getCreator().mspid
    	if(!submitter.includes('Agency')) {
    	     throw new Error(`Only the agency can update a quotation`)
        }
    	const quotationBuffer = await ctx.stub.getState(quotationID)
    	const quotationString = quotationBuffer.toString()
        const quotation = JSON.parse(quotationString)
           quotation.State = newState
    	await ctx.stub.putState(quotationID, Buffer.from(JSON.stringify(quotation)))
    	return quotation

    }
    
    async deleteLedger(ctx, id) {
    	const quotation = await ctx.stub.getState(id)
    	if (!quotation || quotation.length === 0) {
            throw new Error(`The quotation ${id} does not exist`)
        }
    	return ctx.stub.deleteState(id)
    }

}

module.exports = QuotationContract