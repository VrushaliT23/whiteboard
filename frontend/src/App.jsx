import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { nanoid } from 'nanoid';
import { WhiteboardRoom } from './WhiteboardRoom';


// This component generates a unique ID and redirects
const Home = () => {
  return <Navigate to={`/room/${nanoid()}`} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<WhiteboardRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;