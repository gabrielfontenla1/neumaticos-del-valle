/**
 * Multi-provider messaging abstraction layer
 *
 * This module provides a unified interface for working with different
 * messaging providers (Twilio, Meta WhatsApp Business API).
 *
 * All providers implement the MessagingProvider interface and transform
 * their specific formats to/from the normalized message format.
 */

export * from './types'
export * from './provider'
