import { encode, decode } from '../src'

// Notice: no Amount or Fee
const tx_json = {
  Account: 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ',
  // Amount: '1000',
  Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  // Fee: '10',

  // JavaScript converts operands to 32-bit signed ints after doing bitwise
  // operations. We need to convert it back to an unsigned int with >>> 0.
  Flags: (1 << 31) >>> 0, // tfFullyCanonicalSig

  Sequence: 1,
  TransactionType: 'Payment',
  // TxnSignature,
  // Signature,
  // SigningPubKey
}

describe('encoding and decoding tx_json', function () {
  it('can encode tx_json without Amount or Fee', function () {
    const encoded = encode(tx_json)
    const decoded = decode(encoded)
    expect(tx_json).toEqual(decoded)
  })

  it('can encode payment transaction with DeliverMax alias', function () {
    const paytxn = {
      TransactionType: 'Payment',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      DeliverMax: '1234',
      Amount: '1234',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      DestinationTag: 1,
      Fee: '12',
      Flags: 2147483648,
      LastLedgerSequence: 65953073,
      Sequence: 65923914,
      SigningPubKey:
        '02F9E33F16DF9507705EC954E3F94EB5F10D1FC4A354606DBE6297DBB1096FE654',
      TxnSignature:
        '3045022100E3FAE0EDEC3D6A8FF6D81BC9CF8288A61B7EEDE8071E90FF9314CB4621058D10022043545CF631706D700CEE65A1DB83EFDD185413808292D9D90F14D87D3DC2D8CB',
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      Paths: [
        [{ currency: 'BTC', issuer: 'r9vbV3EHvXWjSkeQ6CAcYVPGeq7TuiXY2X' }],
      ],
      SendMax: '100000000',
    } as any

    const encoded = encode(paytxn)
    const decoded = decode(encoded)
    console.log('decoded txn:')
    console.log(decoded)
    expect(paytxn).toEqual(decoded)
  })
  it('can encode tx_json with Amount and Fee', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10',
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  it('can encode tx_json with TicketCount', function () {
    const my_tx = Object.assign({}, tx_json, {
      TicketCount: 2,
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  it('can encode tx_json with TicketSequence', function () {
    const my_tx = Object.assign({}, tx_json, {
      Sequence: 0,
      TicketSequence: 2,
    })
    const encoded = encode(my_tx)
    const decoded = decode(encoded)
    expect(my_tx).toEqual(decoded)
  })
  it('can decode a transaction with an issued currency that evaluates to XRP', function () {
    // Encoding is done prior, because this is disallowed during encoding with client libraries to avoid scam XRP tokens.
    const expectedTx = {
      TransactionType: 'TrustSet',
      Flags: 0,
      Sequence: 19,
      LimitAmount: {
        value: '200',
        currency: '0000000000000000000000005852500000000000',
        issuer: 'r9hEDb4xBGRfBCcX3E4FirDWQBAYtpxC8K',
      },
      Fee: '10',
      SigningPubKey:
        '023076CBB7A61837F1A23D4A3DD7CE810B694992EB0959AB9D6F4BB6FED6F8CC26',
      TxnSignature:
        '304502202D0CD77D8E765E3783C309CD663723B18406B7950A348A6F301492916A990FC70221008A76D586111205304F10ADEFDFDDAF804EF202D8CD1E492DC6E1AA8030EA1844',
      Account: 'rPtfQWdcdhuL9eNeNv5YfmekSX3K7vJHbG',
    }
    const encoded = encode(expectedTx)
    const decoded = decode(encoded)
    expect(expectedTx).toEqual(decoded)
  })
  it('throws when Amount is invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000.001',
      Fee: '10',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  it('throws when Fee is invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000',
      Fee: '10.123',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  it('throws when Amount and Fee are invalid', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: '1000.789',
      Fee: '10.123',
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
  it('throws when Amount is a number instead of a string-encoded integer', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: 1000.789,
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })

  it('throws when Fee is a number instead of a string-encoded integer', function () {
    const my_tx = Object.assign({}, tx_json, {
      Amount: 1234.56,
    })
    expect(() => {
      encode(my_tx)
    }).toThrow()
  })
})
