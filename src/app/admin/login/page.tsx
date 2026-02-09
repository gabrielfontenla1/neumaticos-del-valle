/**
 * Admin Login Page - Redirect to 404
 *
 * This page now redirects to 404 to hide the admin login location.
 * The actual login is available at /panel?acc=SECRET_KEY
 */
import { notFound } from 'next/navigation'

export default function AdminLoginPage() {
  // Return 404 - admin login is now hidden at /panel
  notFound()
}
