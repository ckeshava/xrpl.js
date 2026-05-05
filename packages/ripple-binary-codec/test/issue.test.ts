import { BinaryParser } from '../src/binary'
import { Issue } from '../src/types/issue'

describe('Issue type conversion functions', () => {
  it(`test from value xrp`, () => {
    const xrpJson = { currency: 'XRP' }
    const xrpIssue = Issue.from(xrpJson)
    expect(xrpIssue.toJSON()).toEqual(xrpJson)
  })

  it(`test from value issued currency`, () => {
    const iouJson = {
      currency: 'USD',
      issuer: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
    }
    const iouIssue = Issue.from(iouJson)
    expect(iouIssue.toJSON()).toEqual(iouJson)
  })

  it(`test from value non-standard currency`, () => {
    const iouJson = {
      currency: '0123456789ABCDEF0123456789ABCDEF01234567',
      issuer: 'rG1QQv2nh2gr7RCZ1P8YYcBUKCCN633jCn',
    }
    const iouIssue = Issue.from(iouJson)
    expect(iouIssue.toJSON()).toEqual(iouJson)
  })

  it(`test from value mpt`, () => {
    const mptJson = {
      mpt_issuance_id: 'BAADF00DBAADF00DBAADF00DBAADF00DBAADF00DBAADF00D',
    }
    const mptIssue = Issue.from(mptJson)
    expect(mptIssue.toJSON()).toEqual(mptJson)
  })

  it(`test from parser xrp`, () => {
    const xrpJson = { currency: 'XRP' }
    const xrpIssue = Issue.from(xrpJson)
    const parser = new BinaryParser(xrpIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toEqual(xrpJson)
  })

  it(`test from parser issued currency`, () => {
    const iouJson = {
      currency: 'EUR',
      issuer: 'rLUEXYuLiQptky37CqLcm9USQpPiz5rkpD',
    }
    const iouIssue = Issue.from(iouJson)
    const parser = new BinaryParser(iouIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toEqual(iouJson)
  })

  it(`test from parser non-standard currency`, () => {
    const iouJson = {
      currency: '0123456789ABCDEF0123456789ABCDEF01234567',
      issuer: 'rLUEXYuLiQptky37CqLcm9USQpPiz5rkpD',
    }
    const iouIssue = Issue.from(iouJson)
    const parser = new BinaryParser(iouIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toEqual(iouJson)
  })

  it(`test from parser mpt`, () => {
    const mptJson = {
      mpt_issuance_id: 'BAADF00DBAADF00DBAADF00DBAADF00DBAADF00DBAADF00D',
    }
    const mptIssue = Issue.from(mptJson)
    const parser = new BinaryParser(mptIssue.toHex())
    const parserIssue = Issue.fromParser(parser)
    expect(parserIssue.toJSON()).toEqual(mptJson)
  })

  it(`throws with invalid input`, () => {
    const invalidJson = { random: 123 }
    expect(() => {
      // @ts-expect-error -- need to test error message
      Issue.from(invalidJson)
    }).toThrow(new Error('Invalid type to construct an Issue'))
  })
})

/**
 * The internal 44-byte buffer for an MPT issue is `issuer(20) ‖ NO_ACCOUNT(20) ‖ seq(4)`.
 * Issue.from() takes the big-endian sequence from `mpt_issuance_id` and writes it as
 * little-endian into the buffer. Issue.fromParser() stores the wire bytes verbatim.
 * Issue.toJSON() reads the trailing 4 bytes as little-endian unconditionally.
 *
 * When a wire blob carries the sequence in the same byte order as the JSON
 * mpt_issuance_id (big-endian), the two ingress paths produce different internal
 * buffers for the same logical id, and toJSON() returns a byte-reversed mpt_issuance_id.
 *
 * Sequence 0x00010203 is non-palindromic under byte reversal so the corruption is
 * visible in the assertion diff.
 */
describe('Issue MPT serialization — from()/fromParser() consistency', () => {
  const issuerHex = 'E0739D43718DB5815CE070D4D514A261EC872C93'
  const seqBeHex = '00010203'
  const noAccountHex = '0000000000000000000000000000000000000001'
  const mptIssuanceId = seqBeHex + issuerHex
  const wireSeqBe = issuerHex + noAccountHex + seqBeHex

  it('from(JSON) and fromParser(BE-seq wire) produce equal internal buffers', () => {
    const fromJson = Issue.from({ mpt_issuance_id: mptIssuanceId })
    const fromWire = Issue.fromParser(new BinaryParser(wireSeqBe))
    expect(fromJson.toHex().toUpperCase()).toEqual(
      fromWire.toHex().toUpperCase(),
    )
  })

  it('fromParser(BE-seq wire).toJSON() round-trips mpt_issuance_id', () => {
    const fromWire = Issue.fromParser(new BinaryParser(wireSeqBe))
    expect(fromWire.toJSON()).toEqual({ mpt_issuance_id: mptIssuanceId })
  })
})
