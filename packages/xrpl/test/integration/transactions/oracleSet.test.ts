import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import { OracleSet } from '../../../src'
import { Oracle } from '../../../src/models/ledger'
import { getSignedTx } from '../../../src/sugar'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('OracleSet', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const tx: OracleSet = {
        TransactionType: 'OracleSet',
        Account: testContext.wallet.classicAddress,
        OracleDocumentID: 1234,
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: 'XRP',
              QuoteAsset: 'USD',
              AssetPrice: 740,
              Scale: 3,
            },
          },
          {
            PriceData: {
              BaseAsset: 'ABC',
              QuoteAsset: 'DEF',
              AssetPrice: 111,
              Scale: 2,
            },
          },
        ],
        Provider: stringToHex('chainlink'),
        URI: '6469645F6578616D706C65',
        AssetClass: stringToHex('currency'),
      }

      // this is a canary transaction with single data element update
      // it is used to compare the differences in transaction signatures between `tx` and `tx_single_update`
      const tx_single_update: OracleSet = {
        TransactionType: 'OracleSet',
        Account: testContext.wallet.classicAddress,
        OracleDocumentID: 1234,
        LastUpdateTime: Math.floor(Date.now() / 1000),
        PriceDataSeries: [
          {
            PriceData: {
              BaseAsset: 'XRP',
              QuoteAsset: 'USD',
              AssetPrice: 740,
              Scale: 3,
            },
          },
        ],
        Provider: stringToHex('chainlink'),
        URI: '6469645F6578616D706C65',
        AssetClass: stringToHex('currency'),
      }

      const signed_tx_multiple_update = await getSignedTx(
        testContext.client,
        tx,
        {
          wallet: testContext.wallet,
        },
      )

      const signed_tx_single_update = await getSignedTx(
        testContext.client,
        tx_single_update,
        {
          wallet: testContext.wallet,
        },
      )

      // the below assertion is false. Its retained for illustration purposes
      // the last 12 characters are different: `...4445460000000000E1F1` and `...5553440000000000E1F1`
      assert.equal(signed_tx_multiple_update, signed_tx_single_update)

      await testTransaction(testContext.client, tx, testContext.wallet)

      const result = await testContext.client.request({
        command: 'account_objects',
        account: testContext.wallet.classicAddress,
        type: 'oracle',
      })

      // confirm that the Oracle was actually created
      assert.equal(result.result.account_objects.length, 1)

      // confirm details of Oracle ledger entry object
      const oracle = result.result.account_objects[0] as Oracle
      assert.equal(oracle.LastUpdateTime, tx.LastUpdateTime)
      assert.equal(oracle.Owner, testContext.wallet.classicAddress)
      assert.equal(oracle.AssetClass, tx.AssetClass)
      assert.equal(oracle.Provider, tx.Provider)
      assert.equal(oracle.PriceDataSeries.length, 2)
      assert.equal(oracle.PriceDataSeries[0].PriceData.BaseAsset, 'XRP')
      assert.equal(oracle.PriceDataSeries[0].PriceData.QuoteAsset, 'USD')
      assert.equal(oracle.PriceDataSeries[0].PriceData.AssetPrice, '2e4')
      assert.equal(oracle.PriceDataSeries[0].PriceData.Scale, 3)

      assert.equal(oracle.PriceDataSeries[1].PriceData.BaseAsset, 'ABC')
      assert.equal(oracle.PriceDataSeries[1].PriceData.QuoteAsset, 'DEF')
      assert.equal(oracle.PriceDataSeries[1].PriceData.AssetPrice, '6f') // 6f in hexa-decimal translates to 111 in decimal system
      assert.equal(oracle.PriceDataSeries[1].PriceData.Scale, 2)
      assert.equal(oracle.Flags, 0)
    },
    TIMEOUT,
  )
})
