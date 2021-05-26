import { mat4 } from 'gl-matrix';
//@ts-ignore
import vsSource from './shaders/shader.vert';
//@ts-ignore
import fsSource from './shaders/shader.frag';

interface ProgramInfo { 
	program: WebGLProgram,
	attribLocations: {
		vertexPosition: number,
	},
	uniformLocations: {
		projectionMatrix: WebGLUniformLocation | null,
		modelViewMatrix: WebGLUniformLocation | null,
	},
};

type Buffers = Record<'position', WebGLBuffer>

function getCanvasElement(query: string | WebGL2RenderingContext): HTMLCanvasElement {
	if (typeof query === "string") {

		const element = document.querySelector(query);

		if (!(element	instanceof HTMLCanvasElement)) {
			throw Error("Failed to get Canvas Element");
		}

		return element;
	} else {
		const element = query.canvas;
		if (!(element	instanceof HTMLCanvasElement)) {
			throw new Error("Not a canvas");
		};
		return element;
	}
}

function loadShader(gl: WebGL2RenderingContext, type: number, source: string) {
	const shader = (() => {
		const shader = gl.createShader(type);
		if (!shader) {
			throw new Error("Failed to create shader");
		}
		return shader;
	})()
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Failed to compile shader with error ${log}`);
	}
	return shader;
}

function initShaderProgram(gl: WebGL2RenderingContext) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const shaderProgram = (() => {
		const shaderProgram = gl.createProgram();
		if (!shaderProgram) {
			throw Error("Failed to create program");
		}
		return shaderProgram;
	})()

	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		const log = gl.getProgramInfoLog(shaderProgram);
		throw new Error(`Failed to initialize the shader program: ${log}`);
	}
	return shaderProgram;
}

function createBuffer(gl: WebGL2RenderingContext) {
	const buffer = gl.createBuffer();
	if (!buffer) {
		throw new Error("Failed to create buffer");
	}
	return buffer;
}

function initBuffers(gl: WebGL2RenderingContext) {
	const positionBuffer = createBuffer(gl);
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const positions = [
		-1.0, 1.0,
		1.0, 1.0,
		-1.0, -1.0,
		1.0, -1.0,
	];

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
	}
}

function drawScene(gl: WebGL2RenderingContext, programInfo: ProgramInfo, buffers: Buffers): void {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const fov = 45 * Math.PI / 180;
	const canvas = getCanvasElement(gl);
	const aspect = canvas.clientWidth / canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();

	mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

	{
		const numComponents = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const stride = 0;
		const offset = 0;

		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
		gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
	}

	gl.useProgram(programInfo.program);

	gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

	{
		const offset = 0;
		const vertexCount = 4;
		gl.drawArrays(gl.TRIANGLE_STRIP, offset,vertexCount);
	}
}

function init() {
	const element = getCanvasElement("#webgl-canvas");
	const gl = (() => {
		const gl = element.getContext('webgl2');
		if (gl === null) {
			throw Error("Failed to get canvas context");
		}
		return gl;
	})()

	const shaderProgram = initShaderProgram(gl);
	const programInfo: ProgramInfo = { program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
		},
	};

	const buffers: Buffers = initBuffers(gl);
	drawScene(gl, programInfo, buffers);
}

window.addEventListener("load", init);
