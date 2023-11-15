import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

// TODO: add docs

/**
 * @category Transaction Models
 */
export interface DIDSet extends BaseTransaction {
  TransactionType: 'DIDSet'

  Data?: string

  DIDDocument?: string

  URI?: string
}

/**
 * Verify the form and type of a DIDSet at runtime.
 *
 * @param tx - A DIDSet Transaction.
 * @throws When the DIDSet is malformed.
 */
export function validateDIDSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'Data', isString)

  validateOptionalField(tx, 'DIDDocument', isString)

  validateOptionalField(tx, 'URI', isString)
}
