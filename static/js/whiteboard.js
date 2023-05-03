document.addEventListener("DOMContentLoaded", function () {
  const canvas = new fabric.Canvas("canvas", { selection: false });

  function setBackgroundImage(url) {
    fabric.Image.fromURL(url, function (img) {
      img.set({
        scaleX: canvas.width / img.width,
        scaleY: canvas.height / img.height,
      });
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
  }

  //setBackgroundImage("http://clipart-library.com/img1/1147856.png");

  // Color picker
  const colorPicker = document.getElementById("colorPicker");
  colorPicker.addEventListener("change", function () {
    canvas.freeDrawingBrush.color = colorPicker.value;
  });

  // Add Text button
  const addTextBtn = document.getElementById("addText");
  const textInput = document.getElementById("textInput");
  addTextBtn.addEventListener("click", function () {
    text = new fabric.IText(textInput.value, {
      left: 50,
      top: 50,
      fill: colorPicker.value,
    });
    canvas.add(text);
  });

  // Clear button
  const clearBtn = document.getElementById("clear");
  clearBtn.addEventListener("click", function () {
    canvas.getObjects().forEach(function (obj) {
      if (obj !== canvas.backgroundImage) {
        canvas.remove(obj);
      }
    });
    canvas.discardActiveObject();
    canvas.renderAll();
  });

  // Undo button
  const undoBtn = document.getElementById("undo");
  const undoStack = [];
  undoBtn.addEventListener("click", function () {
    if (canvas._objects.length > 0) {
      const lastItem = canvas._objects.pop();
      undoStack.push(lastItem);
      canvas.renderAll();
    }
  });

  // Add player position buttons
  const addPlayerButtons = document.querySelectorAll("#addPlayers button");
  addPlayerButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const position = button.id.replace("add", "");
      const playerText = new fabric.Text(position, {
        left: 50,
        top: 50,
        fontSize: 40,
        fill: colorPicker.value,
        originX: "center",
        originY: "center",
        fontFamily: "Arial",
      });

      const playerCircle = new fabric.Circle({
        left: 50,
        top: 50,
        radius: 30,
        fill: "transparent",
        originX: "center",
        originY: "center",
        stroke: colorPicker.value,
      });

      const player = new fabric.Group([playerCircle, playerText], {
        left: 50,
        top: 50,
        hasControls: true,
        hasBorders: true,
        hasRotatingPoint: true,
        cornerStyle: "circle",
      });

      canvas.add(player);
    });
  });
  const freehandBtn = document.getElementById("freehand");
  const freehandWidthSlider = document.getElementById("freehandWidthSlider");

  freehandBtn.addEventListener("click", function () {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = colorPicker.value;
    canvas.freeDrawingBrush.width =
      parseInt(freehandWidthSlider.value, 10) || 1;
    canvas.freeDrawingBrush.shadowBlur = 0;
  });

  // Update freehand brush width when the slider value changes
  freehandWidthSlider.addEventListener("input", function () {
    canvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
  });

  // Save to Device button
  const saveToDeviceBtn = document.getElementById("saveToDevice");
  saveToDeviceBtn.addEventListener("click", function () {
    // Prompt the user to enter a title
    const title = prompt("Please enter a title for your image:");
    if (title === null || title === "") {
      alert("No title entered. Image not saved.");
      return;
    }

    // Save the canvas with the background
    const backgroundColor = canvas.backgroundColor;
    canvas.setBackgroundColor("#ffffff", function () {
      const dataURL = canvas.toDataURL({ format: "png" });
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = title + ".png";
      link.click();

      // Reset the canvas background color
      canvas.setBackgroundColor(backgroundColor, function () {
        canvas.renderAll();
      });
    });
  });

  // Select button
  const selectBtn = document.getElementById("select");
  selectBtn.addEventListener("click", function () {
    canvas.isDrawingMode = false;
    drawArrowBtn.classList.remove("active");
  });

  // create a rect object
  var deleteIcon =
    "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";

  var cloneIcon =
    "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='iso-8859-1'%3F%3E%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 55.699 55.699' width='100px' height='100px' xml:space='preserve'%3E%3Cpath style='fill:%23010002;' d='M51.51,18.001c-0.006-0.085-0.022-0.167-0.05-0.248c-0.012-0.034-0.02-0.067-0.035-0.1 c-0.049-0.106-0.109-0.206-0.194-0.291v-0.001l0,0c0,0-0.001-0.001-0.001-0.002L34.161,0.293c-0.086-0.087-0.188-0.148-0.295-0.197 c-0.027-0.013-0.057-0.02-0.086-0.03c-0.086-0.029-0.174-0.048-0.265-0.053C33.494,0.011,33.475,0,33.453,0H22.177 c-3.678,0-6.669,2.992-6.669,6.67v1.674h-4.663c-3.678,0-6.67,2.992-6.67,6.67V49.03c0,3.678,2.992,6.669,6.67,6.669h22.677 c3.677,0,6.669-2.991,6.669-6.669v-1.675h4.664c3.678,0,6.669-2.991,6.669-6.669V18.069C51.524,18.045,51.512,18.025,51.51,18.001z M34.454,3.414l13.655,13.655h-8.985c-2.575,0-4.67-2.095-4.67-4.67V3.414z M38.191,49.029c0,2.574-2.095,4.669-4.669,4.669H10.845 c-2.575,0-4.67-2.095-4.67-4.669V15.014c0-2.575,2.095-4.67,4.67-4.67h5.663h4.614v10.399c0,3.678,2.991,6.669,6.668,6.669h10.4 v18.942L38.191,49.029L38.191,49.029z M36.777,25.412h-8.986c-2.574,0-4.668-2.094-4.668-4.669v-8.985L36.777,25.412z M44.855,45.355h-4.664V26.412c0-0.023-0.012-0.044-0.014-0.067c-0.006-0.085-0.021-0.167-0.049-0.249 c-0.012-0.033-0.021-0.066-0.036-0.1c-0.048-0.105-0.109-0.205-0.194-0.29l0,0l0,0c0-0.001-0.001-0.002-0.001-0.002L22.829,8.637 c-0.087-0.086-0.188-0.147-0.295-0.196c-0.029-0.013-0.058-0.021-0.088-0.031c-0.086-0.03-0.172-0.048-0.263-0.053 c-0.021-0.002-0.04-0.013-0.062-0.013h-4.614V6.67c0-2.575,2.095-4.67,4.669-4.67h10.277v10.4c0,3.678,2.992,6.67,6.67,6.67h10.399 v21.616C49.524,43.26,47.429,45.355,44.855,45.355z'/%3E%3C/svg%3E%0A";

  var deleteImg = document.createElement("img");
  deleteImg.src = deleteIcon;
  deleteImg.crossOrigin = "anonymous";

  var cloneImg = document.createElement("img");
  cloneImg.src = cloneIcon;
  cloneImg.crossOrigin = "anonymous";

  function renderIcon(icon) {
    return function renderIcon(ctx, left, top, styleOverride, fabricObject) {
      var size = this.cornerSize;
      ctx.save();
      ctx.translate(left, top);
      ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
      ctx.drawImage(icon, -size / 2, -size / 2, size, size);
      ctx.restore();
    };
  }

  fabric.Object.prototype.controls.deleteControl = new fabric.Control({
    x: 0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: 16,
    cursorStyle: "pointer",
    mouseUpHandler: deleteObject,
    render: renderIcon(deleteImg),
    cornerSize: 24,
  });

  fabric.Object.prototype.controls.clone = new fabric.Control({
    x: -0.5,
    y: -0.5,
    offsetY: -16,
    offsetX: -16,
    cursorStyle: "pointer",
    mouseUpHandler: cloneObject,
    render: renderIcon(cloneImg),
    cornerSize: 24,
  });

  function deleteObject(eventData, transform) {
    var target = transform.target;
    var canvas = target.canvas;
    canvas.remove(target);
    canvas.requestRenderAll();
  }

  function cloneObject(eventData, transform) {
    var target = transform.target;
    var canvas = target.canvas;
    target.clone(function (cloned) {
      cloned.left += 10;
      cloned.top += 10;
      canvas.add(cloned);
    });
  }
  // Add Outlined Circle button
  const addOutlinedCircleBtn = document.getElementById("addOutlinedCircle");
  addOutlinedCircleBtn.addEventListener("click", function () {
    const outlinedCircle = new fabric.Circle({
      radius: 20,
      fill: "transparent",
      stroke: colorPicker.value,
      strokeWidth: 2,
      left: 50,
      top: 50,
    });
    canvas.add(outlinedCircle);
  });

  // Add Outlined Triangle button
  const addOutlinedTriangleBtn = document.getElementById("addOutlinedTriangle");
  addOutlinedTriangleBtn.addEventListener("click", function () {
    const outlinedTriangle = new fabric.Triangle({
      width: 40,
      height: 40,
      fill: "transparent",
      stroke: colorPicker.value,
      strokeWidth: 2,
      left: 50,
      top: 150,
    });
    canvas.add(outlinedTriangle);
  });

  // Add Rectangle button
  const addRectangleBtn = document.getElementById("addRectangle");
  addRectangleBtn.addEventListener("click", function () {
    const rectangle = new fabric.Rect({
      width: 40,
      height: 40,
      fill: "transparent",
      stroke: colorPicker.value,
      strokeWidth: 2,
      left: 150,
      top: 50,
    });
    canvas.add(rectangle);
  });
  const eraseBtn = document.getElementById("erase");

  eraseBtn.addEventListener("click", function () {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = "white";
    canvas.freeDrawingBrush.width =
      parseInt(freehandWidthSlider.value, 10) || 1;
    canvas.freeDrawingBrush.shadowBlur = 0;
  });
  function handleButtonSelection(e) {
    const toolbar = document.getElementById("toolbar");
    const buttons = toolbar.getElementsByTagName("button");
    for (const button of buttons) {
      if (button === e.target) {
        button.classList.toggle("selected");
      } else {
        button.classList.remove("selected");
      }
    }
  }

  freehandBtn.addEventListener("click", handleButtonSelection);
  selectBtn.addEventListener("click", handleButtonSelection);
  eraseBtn.addEventListener("click", handleButtonSelection);
  function getCanvasDataUrl() {
    return canvas.toDataURL("image/png");
  }

  function saveCanvasImage() {
    const canvasDataUrl = getCanvasDataUrl();
    const title = document.getElementById("title-input").value;
    const csrfToken = document.querySelector(
      "[name=csrfmiddlewaretoken]"
    ).value;

    fetch("/save_canvas_image/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": csrfToken,
      },
      body: new URLSearchParams({
        image_data: canvasDataUrl,
        title: title,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          console.log("Image saved successfully.");
          window.location.href = "/view_images/";
        } else {
          console.error("Error saving image:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  document
    .getElementById("save-image-btn")
    .addEventListener("click", saveCanvasImage);
});
