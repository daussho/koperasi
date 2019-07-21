<template>
    <v-app>
        <div>
            <template>
                <Login/>
            </template>
        </div>
    </v-app>
</template>

<script>
import Login from "./components/Login";

export default {
    name: 'App',
    components: {
        Login,
    },
    data () {
        return {
            login: this.$store.state.statusLogin
        }
    }
}
</script>
