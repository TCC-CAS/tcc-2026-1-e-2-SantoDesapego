import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home             from './pages/Home';
import Login            from './pages/Login';
import Cadastro         from './pages/Cadastro';
import Perfil           from './pages/Perfil';
import Anunciar         from './pages/Anunciar';
import Explorar         from './pages/Explorar';
import Sobre            from './pages/Sobre';
import Anuncio          from './pages/Anuncio';
import Mensagens        from './pages/Mensagens';
import CompraRealizada  from './pages/CompraRealizada';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Home />}             />
        <Route path="/login"             element={<Login />}            />
        <Route path="/cadastro"          element={<Cadastro />}         />
        <Route path="/perfil"            element={<Perfil />}           />
        <Route path="/anunciar"          element={<Anunciar />}         />
        <Route path="/explorar"          element={<Explorar />}         />
        <Route path="/sobre"             element={<Sobre />}            />
        <Route path="/anuncio/:id"       element={<Anuncio />}          />
        <Route path="/mensagens"         element={<Mensagens />}        />
        <Route path="/compra-realizada"  element={<CompraRealizada />}  />
      </Routes>
    </BrowserRouter>
  );
}

export default App;