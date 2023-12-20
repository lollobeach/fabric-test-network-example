'use strict';

const { Contract } = require('fabric-contract-api')

class QuotationContract extends Contract {

    async initLedger(ctx) {
    }
    
    
    async getQuotation(ctx, quotationID) {
    }

    
    async requestQuotation(ctx, id, type, quantity) {
    }

    
    async provideQuotation(ctx, id, newPrice) {
    }
    
    
    async acceptQuotation(ctx, quotationID, newState) {
    }
    
    async deleteLedger(ctx, id) {
    }

}

module.exports = QuotationContract