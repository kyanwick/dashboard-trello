import Home from '../views/Home'
import Login from '../views/auth/Login'
import Register from '../views/auth/Register'
import Trello from '../views/Trello'
import AppLayout from '../components/layouts/AppLayout'

export default [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { layout: AppLayout },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  {
    path: '/trello',
    name: 'Trello',
    component: Trello,
    meta: { layout: AppLayout }, // optional if you want layout
  },
]
