let index = 0;
let numeros = [];
let mensaje = {
  text: "",
  imageData: null
};
let intervalId = null;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "sendMessages") {
    numeros = request.numbers;
    mensaje = {
      text: request.message,
      imageData: request.imageData
    };
    index = 0;
    saveState();
    startSendingMessages();
    sendResponse({status: "Iniciando envío de mensajes"});
  } else if (request.action === "continueMessageSend") {
    restoreState();
    continueMessageSend();
  }
  return true;
});


function startSendingMessages() {
  if (intervalId) clearInterval(intervalId); // Limpiar cualquier intervalo existente
  intervalId = setInterval(() => {
    if (index < numeros.length) {
      let number = numeros[index].replace(/\D/g, '');
      let url = `https://web.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(mensaje.text)}`;
      
      chrome.runtime.sendMessage({
        action: "navigateAndSendMessage",
        url: url,
        message: mensaje,
        index: index
      });

      index++;
      saveState();
    } else {
      clearState(); // Limpiar el estado después de enviar todos los mensajes
      clearInterval(intervalId); // Detener el intervalo cuando se completen todos los mensajes
    }
  }, 20000); // Esperar 20 segundos entre envíos
}

/*function continueMessageSend() {
  waitForElement('span[data-icon="send"]', 30000)
    .then((sendButton) => {
      sendButton.click();
      waitForSeconds(3).then(() => {
        // Continuar con el siguiente mensaje
        startSendingMessages();
      });
    })
    .catch((error) => {
      console.error(`Error al enviar mensaje:`, error);
      // Manejo de errores si es necesario
    });
}*/

function continueMessageSend() {
  console.log("Iniciando continueMessageSend con mensaje:", mensaje);

  waitForPageLoad()
    .then(() => waitForElement('div[contenteditable="true"]', 30000))
    .then(() => {
      if (mensaje.imageData) {
        console.log("Intentando adjuntar imagen...");
        return findAttachButton();
      }
      return Promise.resolve(null);
    })
    .then((attachButton) => {
      if (attachButton) {
        console.log("Botón de adjuntar encontrado, haciendo clic...");
        attachButton.click();
        return waitForElement('input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]', 10000);
      }
      console.log("No se encontró botón de adjuntar o no hay imagen para adjuntar.");
      return Promise.resolve(null);
    })
    .then((imageInput) => {
      if (imageInput && mensaje.imageData) {
        console.log("Input de imagen encontrado, preparando archivo...");
        // Convertir base64 a Blob
        const byteString = atob(mensaje.imageData.split(',')[1]);
        const mimeString = mensaje.imageData.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], {type: mimeString});
        
        // Crear un archivo a partir del Blob
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        
        // Simular la selección de archivo
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;
        imageInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log("Archivo adjuntado, esperando a que se cargue...");
        return waitForSeconds(5);
      }
      console.log("No se pudo adjuntar la imagen o no había imagen para adjuntar.");
      return Promise.resolve();
    })
    .then(() => {
      console.log("Escribiendo texto del mensaje...");
      return waitForElement('div[contenteditable="true"]', 3000);
    })
    .then((messageBox) => {
      if (messageBox) {
        messageBox.focus();
        messageBox.innerHTML = mensaje.text;
        messageBox.dispatchEvent(new Event('input', { bubbles: true }));
        console.log("Texto escrito en el área de mensaje.");
        return waitForSeconds(2);
      }
      throw new Error("No se encontró el área de mensaje.");
    })
    .then(() => {
      console.log("Buscando botón de enviar...");
      return waitForElement('span[data-icon="send"]', 1000);
    })
    .then((sendButton) => {
      if (sendButton) {
        console.log("Botón de enviar encontrado, haciendo clic...");
        sendButton.click();
        return waitForSeconds(3);
      }
      throw new Error("No se encontró el botón de enviar.");
    })
    .then(() => {
      console.log("Mensaje enviado. Continuando con el siguiente...");
      startSendingMessages();
    })
    .catch((error) => {
      console.error(`Error al enviar mensaje:`, error);
    });
}

function waitForElement(selector, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkElement() {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Elemento ${selector} no encontrado dentro del tiempo límite`));
      } else {
        requestAnimationFrame(checkElement);
      }
    }

    checkElement();
  });
}

function waitForSeconds(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000); // Convertir segundos a milisegundos
  });
}

function findAttachButton() {
  console.log("Buscando botón de adjuntar...");
  return new Promise((resolve) => {
    const selectors = [
      'span[data-icon="plus"]',
      'div[title="Attach"]',
      'div[aria-label="Attach"]',
      'div[title="Adjuntar"]',
      'div[aria-label="Adjuntar"]'
    ];
    
    function checkSelectors() {
      for (let selector of selectors) {
        const button = document.querySelector(selector);
        if (button) {
          console.log(`Botón de adjuntar encontrado con selector: ${selector}`);
          return resolve(button);
        }
      }
      requestAnimationFrame(checkSelectors);
    }
    
    checkSelectors();
  });
}

function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

function saveState() {
  localStorage.setItem('whatsappNumbers', JSON.stringify(numeros));
  localStorage.setItem('whatsappMessage', JSON.stringify(mensaje));
  localStorage.setItem('whatsappIndex', index);
}

function restoreState() {
  numeros = JSON.parse(localStorage.getItem('whatsappNumbers')) || [];
  mensaje = JSON.parse(localStorage.getItem('whatsappMessage')) || {text: "", imageData: null};
  index = parseInt(localStorage.getItem('whatsappIndex'), 10) || 0;
}

function clearState() {
  localStorage.removeItem('whatsappNumbers');
  localStorage.removeItem('whatsappMessage');
  localStorage.removeItem('whatsappIndex');
}

window.addEventListener('load', function() {
  restoreState();
  if (numeros.length > 0 && mensaje && index < numeros.length) {
    startSendingMessages();
  }
});
