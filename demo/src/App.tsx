import { Routes, Route, BrowserRouter } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Counter from './components/counter/Counter';
import Form from './components/form/Form';
import Fetcher from './components/fetcher/Fetcher';
import { RetomusWrapper } from '../../dist/index.mjs';
import Modal from './components/modal/Modal';
import Step from './components/step/Step';
import ActionLogger from './components/actionLogger/ActionLogger';
import GlobalStore from './components/globalStore/GlobalStore';

function App() {
  return (
    <RetomusWrapper>
      <BrowserRouter>
        <div className='grid grid-cols-12 w-full'>
          <div className='bg-gray-800 text-white p-4 col-span-2'>
            <Sidebar />
          </div>

          <main className='bg-gray-900 flex-col justify-center items-center flex col-span-10'>
            <Routes>
              <Route path='/' element={<Counter />} />
              <Route path='/counter' element={<Counter />} />
              <Route path='/form' element={<Form />} />
              <Route path='/fetcher' element={<Fetcher />} />
              <Route path='/modal' element={<Modal />} />
              <Route path='/step' element={<Step />} />
              <Route path='/action-logger' element={<ActionLogger />} />
              <Route path='/global-store' element={<GlobalStore />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </RetomusWrapper>
  );
}

export default App;
