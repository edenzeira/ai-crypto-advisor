import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('reason') === 'expired'

  return (
    <AuthLayout>
      {sessionExpired && (
        <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 border border-amber-200">
          Your session has expired. Please sign in again.
        </div>
      )}
      <LoginForm />
      <p className="mt-6 text-center text-sm text-gray-600">
        No account?{' '}
        <Link to="/signup" className="font-medium text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  )
}
