import { Route, Switch } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Auth pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { AuthCallback } from './pages/auth/AuthCallback';

// Main app pages
import Dashboard from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { SocialAccounts } from './pages/SocialAccounts';
import { CreatePost } from './pages/posts/CreatePost';
import { EditPost } from './pages/posts/EditPost';
import { PostDetails } from './pages/posts/PostDetails';

// Layout components
import { MainLayout } from './components/layouts/MainLayout';

export default function App() {
  return (
    <AuthProvider>
      <Switch>
        {/* Public routes */}
        <Route path="/login" component={Login} />
        <Route path="/auth/register" component={Register} />
        <Route path="/auth/forgot-password" component={ForgotPassword} />
        <Route path="/auth/reset-password" component={ResetPassword} />
        <Route path="/auth/callback" component={AuthCallback} />
        
        {/* Protected routes */}
        <Route path="/">
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/dashboard">
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/profile">
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/social-accounts">
          <ProtectedRoute>
            <MainLayout>
              <SocialAccounts />
            </MainLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/posts/create">
          <ProtectedRoute>
            <MainLayout>
              <CreatePost />
            </MainLayout>
          </ProtectedRoute>
        </Route>
        
        <Route path="/posts/:id/edit">
          {(params) => (
            <ProtectedRoute>
              <MainLayout>
                <EditPost id={parseInt(params.id)} />
              </MainLayout>
            </ProtectedRoute>
          )}
        </Route>
        
        <Route path="/posts/:id">
          {(params) => (
            <ProtectedRoute>
              <MainLayout>
                <PostDetails id={parseInt(params.id)} />
              </MainLayout>
            </ProtectedRoute>
          )}
        </Route>
        
        {/* 404 Page */}
        <Route>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-xl mb-6">Page not found</p>
              <a href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Go Home
              </a>
            </div>
          </div>
        </Route>
      </Switch>
    </AuthProvider>
  );
}
