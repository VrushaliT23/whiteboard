import React from 'react';
import { useStore, TOOLS } from './useStore';

// Style for the toolbar container
const toolbarStyle = {
  position: 'absolute',
  top: 10,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '8px 12px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  display: 'flex',
  gap: '10px',
  zIndex: 100, // Ensure it sits on top of the canvas
  border: '1px solid #eee',
};

// Style for the base button
const buttonStyle = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  backgroundColor: '#f9f9f9',
  fontSize: '14px',
};

// Style for the active/selected button
const activeButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#e0e0e0',
  fontWeight: 'bold',
};

// The component receives onUndo and onRedo functions as props from WhiteboardRoom
export const Toolbar = ({ onUndo, onRedo }) => {
  // Get state (tool, color) and actions (setTool, setColor) from our Zustand store
  const { tool, setTool, color, setColor } = useStore();

  return (
    <div style={toolbarStyle}>
      {/* --- Tool Selection Buttons --- */}
      <button
        style={tool === TOOLS.SELECT ? activeButtonStyle : buttonStyle}
        onClick={() => setTool(TOOLS.SELECT)}
      >
        Select
      </button>
      <button
        style={tool === TOOLS.PEN ? activeButtonStyle : buttonStyle}
        onClick={() => setTool(TOOLS.PEN)}
      >
        Pen
      </button>
      <button
        style={tool === TOOLS.RECTANGLE ? activeButtonStyle : buttonStyle}
        onClick={() => setTool(TOOLS.RECTANGLE)}
      >
        Rectangle
      </button>
      <button
        style={tool === TOOLS.ELLIPSE ? activeButtonStyle : buttonStyle}
        onClick={() => setTool(TOOLS.ELLIPSE)}
      >
        Ellipse
      </button>

      {/* --- Color Picker --- */}
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        title="Select Color"
        style={{ border: 'none', width: '30px', height: '30px', padding: 0, cursor: 'pointer' }}
      />

      {/* --- Undo/Redo Buttons --- */}
      <button style={buttonStyle} onClick={onUndo}>
        Undo
      </button>
      <button style={buttonStyle} onClick={onRedo}>
        Redo
      </button>
    </div>
  );
};