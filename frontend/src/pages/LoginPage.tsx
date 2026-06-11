import { Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout>
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
