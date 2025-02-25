import './App.css'
import Post from '@/pages/post'
import Header from "@/components/layout/header.jsx";
import RootLayout from "@/components/layout/RootLayout.jsx";
import {BrowserRouter, Route, Routes} from "react-router-dom";
const App = () => {

  return (
    <>
        <BrowserRouter>
            <Routes>
                <Route element={<RootLayout />}>
                    <Route path="/" element={<Post />} />
                </Route>
                {/*<Route path="/" component={Post} />*/}
            </Routes>
        </BrowserRouter>
    </>
  )
}

export default App
