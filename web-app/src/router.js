import Vue from 'vue'
import Router from 'vue-router'

const Login = () => import('./components/Login')
const Home = () => import('./components/Home')

Vue.use(Router)

export default new Router({
    routes: [
        {
            path: '/login',
            name: 'Login',
            meta: {title: 'Login'},
            component: Login
        },
        {
            path: '/home',
            name: 'Home',
            meta: {title: 'Home'},
            component: Home
        }
    ]
})
