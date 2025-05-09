import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <div className='w-full h-screen bg-gray-800 text-white flex flex-col p-4 space-y-4'>
      <Link to='/counter' className='hover:bg-gray-700 p-2 rounded'>
        Counter
      </Link>
      <Link to='/form' className='hover:bg-gray-700 p-2 rounded'>
        Form
      </Link>
      <Link to='/fetcher' className='hover:bg-gray-700 p-2 rounded'>
        Fetcher
      </Link>
      <Link to='/modal' className='hover:bg-gray-700 p-2 rounded'>
        Modal
      </Link>
      <Link to='/step' className='hover:bg-gray-700 p-2 rounded'>
        Step
      </Link>
      <Link to='/action-logger' className='hover:bg-gray-700 p-2 rounded'>
        Action Logger
      </Link>
      <Link to='/global-store' className='hover:bg-gray-700 p-2 rounded'>
        Global Store
      </Link>
    </div>
  );
}

export default Sidebar;
