import fixtures from './fixtures/data-driven-tests.json'

const { binary } = require('../src/coretypes')
const { encode, decode } = require('../src')
const { makeParser, BytesList, BinarySerializer } = binary
const { coreTypes } = require('../src/types')
const { UInt8, UInt16, UInt32, UInt64, STObject } = coreTypes

const deliverMinTx = require('./fixtures/delivermin-tx.json')
const deliverMinTxBinary = require('./fixtures/delivermin-tx-binary.json')
const SignerListSet = {
  tx: require('./fixtures/signerlistset-tx.json'),
  binary: require('./fixtures/signerlistset-tx-binary.json'),
  meta: require('./fixtures/signerlistset-tx-meta-binary.json'),
}
const DepositPreauth = {
  tx: require('./fixtures/deposit-preauth-tx.json'),
  binary: require('./fixtures/deposit-preauth-tx-binary.json'),
  meta: require('./fixtures/deposit-preauth-tx-meta-binary.json'),
}
const Escrow = {
  create: {
    tx: require('./fixtures/escrow-create-tx.json'),
    binary: require('./fixtures/escrow-create-binary.json'),
  },
  finish: {
    tx: require('./fixtures/escrow-finish-tx.json'),
    binary: require('./fixtures/escrow-finish-binary.json'),
    meta: require('./fixtures/escrow-finish-meta-binary.json'),
  },
  cancel: {
    tx: require('./fixtures/escrow-cancel-tx.json'),
    binary: require('./fixtures/escrow-cancel-binary.json'),
  },
}
const PaymentChannel = {
  create: {
    tx: require('./fixtures/payment-channel-create-tx.json'),
    binary: require('./fixtures/payment-channel-create-binary.json'),
  },
  fund: {
    tx: require('./fixtures/payment-channel-fund-tx.json'),
    binary: require('./fixtures/payment-channel-fund-binary.json'),
  },
  claim: {
    tx: require('./fixtures/payment-channel-claim-tx.json'),
    binary: require('./fixtures/payment-channel-claim-binary.json'),
  },
}

const Ticket = {
  create: {
    tx: require('./fixtures/ticket-create-tx.json'),
    binary: require('./fixtures/ticket-create-binary.json'),
  },
}

let json_undefined = {
  TakerPays: '223174650',
  Account: 'rPk2dXr27rMw9G5Ej9ad2Tt7RJzGy8ycBp',
  TransactionType: 'OfferCreate',
  Memos: [
    {
      Memo: {
        MemoType: '584D4D2076616C7565',
        MemoData: '322E3230393635',
        MemoFormat: undefined,
      },
    },
  ],
  Fee: '15',
  OfferSequence: undefined,
  TakerGets: {
    currency: 'XMM',
    value: '100',
    issuer: 'rExAPEZvbkZqYPuNcZ7XEBLENEshsWDQc8',
  },
  Flags: 524288,
  Sequence: undefined,
  LastLedgerSequence: 6220135,
}

let json_omitted = {
  TakerPays: '223174650',
  Account: 'rPk2dXr27rMw9G5Ej9ad2Tt7RJzGy8ycBp',
  TransactionType: 'OfferCreate',
  Memos: [
    {
      Memo: {
        MemoType: '584D4D2076616C7565',
        MemoData: '322E3230393635',
      },
    },
  ],
  Fee: '15',
  TakerGets: {
    currency: 'XMM',
    value: '100',
    issuer: 'rExAPEZvbkZqYPuNcZ7XEBLENEshsWDQc8',
  },
  Flags: 524288,
  LastLedgerSequence: 6220135,
}

const NegativeUNL = require('./fixtures/negative-unl.json')

function bytesListTest() {
  const list = new BytesList()
    .put(Uint8Array.from([0]))
    .put(Uint8Array.from([2, 3]))
    .put(Uint8Array.from([4, 5]))
  it('is an Array<Uint8Array>', function () {
    expect(Array.isArray(list.bytesArray)).toBe(true)
    expect(list.bytesArray[0] instanceof Uint8Array).toBe(true)
  })
  it('keeps track of the length itself', function () {
    expect(list.getLength()).toBe(5)
  })
  it('can join all arrays into one via toBytes', function () {
    const joined = list.toBytes()
    expect(joined.length).toEqual(5)
    expect(joined).toEqual(Uint8Array.from([0, 2, 3, 4, 5]))
  })
}

function assertRecycles(blob) {
  const parser = makeParser(blob)
  const so = parser.readType(STObject)
  const out = new BytesList()
  so.toBytesSink(out)
  const hex = out.toHex()
  expect(hex).toEqual(blob)
  expect(hex + ':').not.toEqual(blob)
}

function nestedObjectTests() {
  fixtures.whole_objects.forEach((f, i) => {
    it(`whole_objects[${i}]: can parse blob and dump out same blob`, () => {
      assertRecycles(f.blob_with_no_signing)
    })
  })
}

function check(type, n, expected) {
  it(`Uint${type.width * 8} serializes ${n} as ${expected}`, function () {
    const bl = new BytesList()
    const serializer = new BinarySerializer(bl)

    // UINT64.from function does not accept number type, it accepts only string | bigint types
    // Other UINT<bits>.from methods accept number type
    if (type.width == 8) {
      n = BigInt(n)
    }
    if (expected === 'throws') {
      expect(() => serializer.writeType(type, n)).toThrow()
      return
    }
    serializer.writeType(type, n)
    expect(bl.toBytes()).toEqual(Uint8Array.from(expected))
  })
}

it(`Uint16 serializes 5 as 0,5`, function () {
  const bl = new BytesList()
  const serializer = new BinarySerializer(bl)
  const expected = [0, 5]
  serializer.writeType(UInt16, 5)
  expect(bl.toBytes()).toEqual(Uint8Array.from(expected))
})

check(UInt8, 5, [5])
check(UInt16, 5, [0, 5])
check(UInt32, 5, [0, 0, 0, 5])
check(UInt32, 0xffffffff, [255, 255, 255, 255])
check(UInt8, 0xfeffffff, 'throws')
check(UInt16, 0xfeffffff, 'throws')
check(UInt32, 0xfeffffff, 'throws')
check(UInt64, 0xfeffffff, [0, 0, 0, 0, 254, 255, 255, 255])
check(UInt64, -1, 'throws')
check(UInt64, 0, [0, 0, 0, 0, 0, 0, 0, 0])
check(UInt64, 1, [0, 0, 0, 0, 0, 0, 0, 1])

function deliverMinTest() {
  it('can serialize DeliverMin', () => {
    expect(encode(deliverMinTx)).toEqual(deliverMinTxBinary)
  })
}

function SignerListSetTest() {
  it('can serialize SignerListSet', () => {
    expect(encode(SignerListSet.tx)).toEqual(SignerListSet.binary)
  })
  it('can serialize SignerListSet metadata', () => {
    expect(encode(SignerListSet.tx.meta)).toEqual(SignerListSet.meta)
  })
}

function DepositPreauthTest() {
  it('can serialize DepositPreauth', () => {
    expect(encode(DepositPreauth.tx)).toEqual(DepositPreauth.binary)
  })
  it('can serialize DepositPreauth metadata', () => {
    expect(encode(DepositPreauth.tx.meta)).toEqual(DepositPreauth.meta)
  })
}

function EscrowTest() {
  it('can serialize EscrowCreate', () => {
    expect(encode(Escrow.create.tx)).toEqual(Escrow.create.binary)
  })
  it('can serialize EscrowFinish', () => {
    expect(encode(Escrow.finish.tx)).toEqual(Escrow.finish.binary)
    expect(encode(Escrow.finish.tx.meta)).toEqual(Escrow.finish.meta)
  })
  it('can serialize EscrowCancel', () => {
    expect(encode(Escrow.cancel.tx)).toEqual(Escrow.cancel.binary)
  })
}

function PaymentChannelTest() {
  it('can serialize PaymentChannelCreate', () => {
    expect(encode(PaymentChannel.create.tx)).toEqual(
      PaymentChannel.create.binary,
    )
  })
  it('can serialize PaymentChannelFund', () => {
    expect(encode(PaymentChannel.fund.tx)).toEqual(PaymentChannel.fund.binary)
  })
  it('can serialize PaymentChannelClaim', () => {
    expect(encode(PaymentChannel.claim.tx)).toEqual(PaymentChannel.claim.binary)
  })
}

function NegativeUNLTest() {
  it('can serialize NegativeUNL', () => {
    expect(encode(NegativeUNL.tx)).toEqual(NegativeUNL.binary)
  })
  it('can deserialize NegativeUNL', () => {
    expect(decode(NegativeUNL.binary)).toEqual(NegativeUNL.tx)
  })
}

function omitUndefinedTest() {
  it('omits fields with undefined value', () => {
    let encodedOmitted = encode(json_omitted)
    let encodedUndefined = encode(json_undefined)
    expect(encodedOmitted).toEqual(encodedUndefined)
    expect(decode(encodedOmitted)).toEqual(decode(encodedUndefined))
  })
}

function ticketTest() {
  it('can serialize TicketCreate', () => {
    expect(encode(Ticket.create.tx)).toEqual(Ticket.create.binary)
  })
}

function nfTokenTest() {
  const fixtures = require('./fixtures/nf-token.json')

  for (const txName of Object.keys(fixtures)) {
    it(`can serialize transaction ${txName}`, () => {
      expect(encode(fixtures[txName].tx.json)).toEqual(
        fixtures[txName].tx.binary,
      )
    })

    it(`can deserialize transaction ${txName}`, () => {
      expect(decode(fixtures[txName].tx.binary)).toEqual(
        fixtures[txName].tx.json,
      )
    })

    it(`can serialize meta ${txName}`, () => {
      expect(encode(fixtures[txName].meta.json)).toEqual(
        fixtures[txName].meta.binary,
      )
    })

    it(`can deserialize meta ${txName}`, () => {
      expect(decode(fixtures[txName].meta.binary)).toEqual(
        fixtures[txName].meta.json,
      )
    })
  }
}

describe('Binary Serialization', function () {
  describe('nestedObjectTests', nestedObjectTests)
  describe('BytesList', bytesListTest)
  describe('DeliverMin', deliverMinTest)
  describe('DepositPreauth', DepositPreauthTest)
  describe('SignerListSet', SignerListSetTest)
  describe('Escrow', EscrowTest)
  describe('PaymentChannel', PaymentChannelTest)
  describe('NegativeUNLTest', NegativeUNLTest)
  describe('OmitUndefined', omitUndefinedTest)
  describe('TicketTest', ticketTest)
  describe('NFToken', nfTokenTest)
})
