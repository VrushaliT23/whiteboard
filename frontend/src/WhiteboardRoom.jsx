import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect, Ellipse, Line } from 'react-konva';
import { nanoid } from 'nanoid';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Toolbar } from './Toolbar';
import { useStore, TOOLS } from './useStore';

// 1. Generate a unique user "origin" for the undo manager
const myOrigin = 'user-' + nanoid(5);

export const WhiteboardRoom = () => {
  const { roomId } = useParams();
  const { tool, color } = useStore();
  const [shapes, setShapes] = useState([]);
  
  // Refs to manage drawing state without triggering constant re-renders
  const isDrawing = useRef(false);
  const currentShapeId = useRef(null);

  // --- Y.js Setup ---
  // We use useMemo to ensure these objects are created only once per room
  const { ydoc, yShapes, provider, undoManager } = useMemo(() => {
    const doc = new Y.Doc();
    // Connect to the backend server (ensure your server is running on ws://127.0.0.1:1234)
    const provider = new WebsocketProvider(
      'ws://127.0.0.1:1234', 
      roomId,
      doc
    );
    // Get the shared array of shapes
    const shapes = doc.getArray('shapes');
    
    // Create the Undo Manager, tracking ONLY changes from this user (myOrigin)
    const undoManager = new Y.UndoManager(shapes, {
      trackedOrigins: new Set([myOrigin]),
    });

    return { ydoc: doc, yShapes: shapes, provider, undoManager };
  }, [roomId]);

  // --- Sync Y.js to React State ---
  useEffect(() => {
    // Observer function runs whenever the Y.js array changes (by any user)
    const observer = (event) => {
      // Update our React state with a deep copy of the array of shapes
      setShapes(yShapes.toJSON());
    };

    // Observe changes and load initial data
    yShapes.observe(observer);
    setShapes(yShapes.toJSON()); 

    // Clean up function on component unmount
    return () => {
      yShapes.unobserve(observer);
      provider.disconnect();
    };
  }, [yShapes, provider]);

  // --- Stage/Canvas Control State (for Zoom/Pan) ---
  const [stage, setStage] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  // --- Canvas Event Handlers ---

  const handleMouseDown = (e) => {
    // Only proceed if a drawing tool is selected
    if (tool === TOOLS.SELECT) return;

    isDrawing.current = true;
    const stageRef = e.target.getStage();
    const pointerPos = stageRef.getPointerPosition();
    
    // Convert screen coordinates to canvas coordinates based on current scale/position
    const x = (pointerPos.x - stage.x) / stage.scale;
    const y = (pointerPos.y - stage.y) / stage.scale;

    const id = nanoid();
    currentShapeId.current = id;

    let newShape;
    switch (tool) {
      case TOOLS.PEN:
        newShape = { id, type: 'pen', points: [x, y], color, strokeWidth: 4 };
        break;
      case TOOLS.RECTANGLE:
        newShape = { id, type: 'rect', x, y, width: 0, height: 0, color };
        break;
      case TOOLS.ELLIPSE:
        newShape = { id, type: 'ellipse', x, y, radiusX: 0, radiusY: 0, color };
        break;
      default:
        return;
    }

    // Add the new shape to the Y.js array, marked with our unique origin
    ydoc.transact(() => {
      yShapes.push([newShape]);
    }, myOrigin);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool === TOOLS.SELECT) return;

    const stageRef = e.target.getStage();
    const pointerPos = stageRef.getPointerPosition();
    
    // Convert screen coordinates to canvas coordinates
    const x = (pointerPos.x - stage.x) / stage.scale;
    const y = (pointerPos.y - stage.y) / stage.scale;

    const index = yShapes.toArray().findIndex((s) => s.id === currentShapeId.current);
    if (index === -1) return;

    const currentShape = yShapes.get(index);
    let updatedShape;

    // Create the updated shape object
    switch (tool) {
      case TOOLS.PEN:
        // For pen, we just append new points to the array
        updatedShape = {
          ...currentShape,
          points: [...currentShape.points, x, y],
        };
        break;
      case TOOLS.RECTANGLE:
        // Update width and height based on current pointer position
        updatedShape = {
          ...currentShape,
          width: x - currentShape.x,
          height: y - currentShape.y,
        };
        break;
      case TOOLS.ELLIPSE:
        // Update radii for the ellipse
        updatedShape = {
          ...currentShape,
          radiusX: Math.abs(x - currentShape.x) / 2,
          radiusY: Math.abs(y - currentShape.y) / 2,
        };
        break;
      default:
        return;
    }

    // Update the shape in the Y.js array within a transaction
    ydoc.transact(() => {
      // Delete the old object and insert the new one
      yShapes.delete(index, 1);
      yShapes.insert(index, [updatedShape]);
    }, myOrigin); 
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    currentShapeId.current = null;
  };

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stageRef = e.target.getStage();
    const oldScale = stageRef.scaleX();
    const pointer = stageRef.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stageRef.x()) / oldScale,
      y: (pointer.y - stageRef.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setStage({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // --- Render ---
  return (
    <>
      <Toolbar 
        onUndo={() => undoManager.undo()}
        onRedo={() => undoManager.redo()}
      />
      
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        // Allow panning/moving the canvas when the 'Select' tool is chosen
        draggable={tool === TOOLS.SELECT} 
        scaleX={stage.scale}
        scaleY={stage.scale}
        x={stage.x}
        y={stage.y}
      >
        <Layer>
          {/* Render all shared shapes */}
          {shapes.map((shape) => {
            if (shape.type === 'rect') {
              return (
                <Rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.color}
                />
              );
            }
            if (shape.type === 'ellipse') {
              // Ellipses are positioned by their center, so we offset the initial x/y
              return (
                <Ellipse
                  key={shape.id}
                  x={shape.x + shape.radiusX} 
                  y={shape.y + shape.radiusY}
                  radiusX={shape.radiusX}
                  radiusY={shape.radiusY}
                  fill={shape.color}
                />
              );
            }
            if (shape.type === 'pen') {
              return (
                <Line
                  key={shape.id}
                  points={shape.points}
                  stroke={shape.color}
                  strokeWidth={shape.strokeWidth || 4}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </>
  );
};