document.addEventListener('DOMContentLoaded', function() {
  var sendButton = document.getElementById('sendButton');
  sendButton.addEventListener('click', function() {
    var numbers = document.getElementById('numbers').value.split('\n');
    var message = document.getElementById('message').value;
    var imageInput = document.getElementById('imageInput');
    
    console.log("Botón clickeado. Números:", numbers, "Mensaje:", message);

    if (imageInput.files.length > 0) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var imageData = e.target.result;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "sendMessages",
            numbers: numbers,
            message: message,
            imageData: imageData
          }, function(response) {
            console.log("Respuesta recibida:", response);
          });
        });
      };
      reader.readAsDataURL(imageInput.files[0]);
    } else { // Enviar solo mensaje de texto como antes
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log("Enviando mensaje a la pestaña:", tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "sendMessages",
          numbers: numbers,
          message: message
        }, function(response) {
          console.log("Respuesta recibida:", response);
        });
      });
    }
  });

    
});