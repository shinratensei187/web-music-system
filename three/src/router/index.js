import Posts from "../pages/Posts"
import Login from "../pages/Login"
import Register from "../pages/Register"
import PostIdPage from "../pages/PostIdPage"
import Cart from "../pages/Cart"
import MyTracks from "../pages/MyTracks"
import AdminTracks from "../pages/AdminTracks"
import PaymentSuccess from "../pages/PaymentSuccess"
import Profile from "../pages/Profile"

/* Доступні всім — авторизованим і ні */
export const sharedRoutes = [
  { path: "/posts",     component: Posts      },
  { path: "/posts/:id", component: PostIdPage },
]

/* Тільки для авторизованих */
export const privateRoutes = [
  { path: "/profile",         component: Profile      },
  { path: "/cart",            component: Cart         },
  { path: "/my-tracks",       component: MyTracks     },
  { path: "/payment-success", component: PaymentSuccess },
  { path: "/admin/tracks",    component: AdminTracks  },
]

/* Тільки для неавторизованих */
export const publicRoutes = [
  { path: "/login",    component: Login    },
  { path: "/register", component: Register },
]
