<template>
    <v-app>
        <div>
            <template v-if=isLogin>
                <v-navigation-drawer
                    v-model="drawer"
                    fixed
                    app
                >
                    <v-list dense>
                        <v-list-tile @click="x">
                        <v-list-tile-action>
                            <v-icon>home</v-icon>
                        </v-list-tile-action>
                        <v-list-tile-content>
                            <v-list-tile-title>Home</v-list-tile-title>
                        </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile @click="x">
                        <v-list-tile-action>
                            <v-icon>contact_mail</v-icon>
                        </v-list-tile-action>
                        <v-list-tile-content>
                            <v-list-tile-title>Contact</v-list-tile-title>
                        </v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                </v-navigation-drawer>
                <v-toolbar color="indigo" dark fixed app>
                    <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
                    <v-toolbar-title>Application</v-toolbar-title>
                </v-toolbar>
                <v-content>
                    
                </v-content>
            </template>
            <template v-else>
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
            drawer: false
        }
    },
    computed: {
        isLogin (){
            let login = sessionStorage.getItem('isLogin');
            if (login){
                return true;
            } else {
                return false;
            }
        }
    }
}
</script>
