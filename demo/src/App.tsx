import { Routes, Route, BrowserRouter } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Counter from './components/counter/Counter';
import Form from './components/counter/Form';
import Fetcher from './components/counter/Fetcher';
import { RetomusWrapper } from '../../dist/index.mjs';
import Modal from './components/counter/Modal';
import Step from './components/counter/Step';

function App() {
  return (
    <RetomusWrapper>
      <BrowserRouter>
        <div className='grid grid-cols-[300px_minmax(900px,_1fr)] w-full'>
          <div className='bg-gray-800 text-white p-4'>
            <Sidebar />
          </div>

          <main className='bg-gray-900 flex-col justify-center items-center flex'>
            <Routes>
              <Route path='/' element={<Counter />} />
              <Route path='/counter' element={<Counter />} />
              <Route path='/form' element={<Form />} />
              <Route path='/fetcher' element={<Fetcher />} />
              <Route path='/modal' element={<Modal />} />
              <Route path='/step' element={<Step />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </RetomusWrapper>
  );
}

export default App;
