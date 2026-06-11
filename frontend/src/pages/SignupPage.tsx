import { Link } from 'react-router-dom'
import AuthLayout from '../components/layout/AuthLayout'
import SignupForm from '../components/auth/SignupForm'

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
