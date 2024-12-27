import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ShaderGen() {
    const [vertex_code, setVertexCode] = useState('');
    const [fragment_code, setFragmentCode] = useState('');
    const [userInput, setUserInput] = useState('');
    const [webglError, setWebglError] = useState('');
    const canvasRef = useRef(null);
    const glRef = useRef(null);
    const programRef = useRef(null);
    const frameIdRef = useRef(null);


    const handleInputChange = (e) => {
        setUserInput(e.target.value);
    };

    const handleGenerate = async () => {
        // Clear the error state and reset refs.
      setWebglError('');
        programRef.current = null;
      glRef.current = null;
       
        try {
            const vertexResponse = await axios.post('http://shadergen-api.onrender.com/api/shaders/vertex', {
                prompt: userInput
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const rawVertexCode = vertexResponse.data.vertex_code;
            setVertexCode(rawVertexCode);

            const fragmentResponse = await axios.post('http://shadergen-api.onrender.com/api/shaders/fragment', {
                vertex_code: rawVertexCode,
                prompt: userInput
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const rawFragmentCode = fragmentResponse.data.fragment_code;
            setFragmentCode(rawFragmentCode);
        } catch (error) {
             console.error('Error during shader fetch:', error.response?.data || error.message);
              if(error.response?.data == "Generated code contains 'while' loop which is not allowed") {
                 setWebglError("The server rejected the shader code because it contains a `while` loop which is not allowed in WebGL");
              }
               else {
                 setWebglError(`Error during shader fetch: ${error.response?.data || error.message}`);
               }
           return;
        }
    };


    const createShader = (gl, type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }

        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        console.log("Source:", source); // log the source
        gl.deleteShader(shader);
        return null;
    };

    const createProgram = (gl, vertexShader, fragmentShader) => {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        const success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }

        console.error('Program linking error:', gl.getProgramInfoLog(program));
        console.log("Vertex Shader Source:", vertex_code);
        console.log("Fragment Shader Source:", fragment_code);
        gl.deleteProgram(program);
        return null;
    };

  const initBuffers = (gl) => {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Create a square that fills the canvas
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ]);
    
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return positionBuffer;
  };


    const findAttributeName = (shaderCode) => {
        const attributeRegex = /attribute\s+vec2\s+([a-zA-Z_]\w*);/;
        const match = shaderCode.match(attributeRegex);

        if (match && match[1]) {
            return match[1];
        }

        return null;
    };

    useEffect(() => {
        if (!canvasRef.current || !vertex_code || !fragment_code) return;

        const canvas = canvasRef.current;
        let gl = canvas.getContext('webgl2');

        if (!gl) {
            gl = canvas.getContext('webgl');

            if (!gl) {
                console.error('WebGL not supported');
                setWebglError('Your browser does not support WebGL. Please check that your browser, computer, and graphics card all have WebGL support');
                return;
            }

            console.warn("WebGL2 not supported, falling back to WebGL. Please note that WebGL has compatibility limitations.");
           setWebglError('WebGL2 not supported, falling back to WebGL. Please note that WebGL has compatibility limitations.');
        }

        // Update canvas size
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        canvas.width = displayWidth;
        canvas.height = displayHeight;

         // Create and compile shaders
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex_code);
        if(!vertexShader) {
            setWebglError("Failed to create vertex shader");
            return;
        }
        
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment_code);

       if(!fragmentShader) {
           setWebglError("Failed to create fragment shader");
            return;
        }
        // Create program
        const program = createProgram(gl, vertexShader, fragmentShader);

        if (!program) {
          setWebglError("Failed to create shader program");
            return;
        }

        programRef.current = program;
        glRef.current = gl;

        // Find attribute name dynamically
        let attributeName = findAttributeName(vertex_code);

        // If we can't find an attribute name, log a user error, but also fall back to "position"
        if (!attributeName) {
            console.error("Could not dynamically find a vertex attribute name in the shader. Please check the console for compilation errors. Falling back to 'position' attribute.");
            setWebglError("Could not dynamically find a vertex attribute name in the shader. Please check the console for compilation errors. Falling back to 'position' attribute. This is usually caused by not having a declared `attribute vec2 my_name;` in your vertex shader.");
            attributeName = "position";
        }


        const positionAttributeLocation = gl.getAttribLocation(program, attributeName);


        if (positionAttributeLocation === -1) {
            console.error(`Attribute location '${attributeName}' not found in vertex shader. Please check the vertex shader code and ensure it has an 'attribute vec2 ${attributeName};' (or similar) declaration.`);
            setWebglError(`Attribute location '${attributeName}' not found in vertex shader. Please check the vertex shader code and ensure it has an 'attribute vec2 ${attributeName};' (or similar) declaration.`);
            return;
        }

        const positionBuffer = initBuffers(gl);

        // Transformations are not working right now, if we need this we can do it in the future, so keep it as Identity
        const projectionMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        const modelViewMatrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);


        // Animation function
        const render = (timestamp) => {
            // Check if the program is still valid
            if (!programRef.current || !glRef.current) {
                console.warn("Renderer skipped a frame because the program or context does not exist. This might happen during unmount, so its expected");
                return;
            }

            const gl = glRef.current;
            const program = programRef.current;

            // Set viewport and clear
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Use the program
            gl.useProgram(program);

            // Set up position attribute
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.vertexAttribPointer(
                positionAttributeLocation,
                2,
                gl.FLOAT,
                false,
                0,
                0,
            );

            // Set uniforms
            const timeLocation = gl.getUniformLocation(program, 'u_time');
            if (timeLocation) {
                gl.uniform1f(timeLocation, timestamp * 0.001);
            }

            const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
            if (resolutionLocation) {
                gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
            }

            const projectionMatrixLocation = gl.getUniformLocation(program, 'projectionMatrix');
            if (projectionMatrixLocation) {
                gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
            }

            const modelViewMatrixLocation = gl.getUniformLocation(program, 'modelViewMatrix');
            if (modelViewMatrixLocation) {
                gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);
            }

            // Draw
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            // Request next frame
            frameIdRef.current = requestAnimationFrame(render);
        };

        // Start rendering
        render(0);

         // Cleanup
        return () => {
            if (frameIdRef.current) {
                cancelAnimationFrame(frameIdRef.current);
            }
            if (glRef.current && programRef.current) {
                glRef.current.deleteProgram(programRef.current);
            }
            if(gl) {
                 gl.deleteShader(vertexShader);
                 gl.deleteShader(fragmentShader);
            }
        };
    }, [vertex_code, fragment_code]);

  return (
    <div className="space-y-4">
       {webglError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{webglError}</span>
      </div>}
      <textarea
        value={userInput}
        onChange={handleInputChange}
        className="w-full h-40 bg-blue-800 bg-opacity-50 text-blue-100 text-lg rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        placeholder="Enter shader description eg. starry sky"
      />
      <button
        onClick={handleGenerate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200 flex items-center justify-center"
      >
        <span className="mr-2">Generate Shader</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="currentColor"/>
        </svg>
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-blue-300 font-semibold">vertex.glsl</h3>
          <pre className="bg-gray-800 rounded-lg p-4 text-sm h-60 overflow-auto">
            <code className="text-blue-100">
              {vertex_code || '// Vertex shader code will appear here'}
            </code>
          </pre>
        </div>
        <div className="space-y-2">
          <h3 className="text-blue-300 font-semibold">fragment.glsl</h3>
          <pre className="bg-gray-800 rounded-lg p-4 text-sm h-60 overflow-auto">
            <code className="text-blue-100">
              {fragment_code || '// Fragment shader code will appear here'}
            </code>
          </pre>
        </div>
      </div>
      <div className="w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
        />
      </div>
    </div>
  );
}