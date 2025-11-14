import { create } from 'zustand';

// Define the available drawing tools as constants for cleaner code
export const TOOLS = {
  SELECT: 'select',
  PEN: 'pen',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
};

// Create the global store using Zustand's `create` function
export const useStore = create((set) => ({
  // --- State Variables ---

  // Default tool is 'select'
  tool: TOOLS.SELECT, 
  
  // Default drawing color
  color: '#000000', 
  
  // --- State Actions (Setters) ---

  // Function to change the active tool
  setTool: (newTool) => set({ tool: newTool }),
  
  // Function to change the drawing color
  setColor: (newColor) => set({ color: newColor }),
}));