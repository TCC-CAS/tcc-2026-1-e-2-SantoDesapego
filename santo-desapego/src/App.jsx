import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home      from './pages/Home';
import Login     from './pages/Login';
import Cadastro  from './pages/Cadastro';
import Perfil from './pages/Perfil';  

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Home />}      />
        <Route path="/login"     element={<Login />}     />
        <Route path="/cadastro"  element={<Cadastro />}  />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;