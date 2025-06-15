const form = document.querySelector("form#uploadForm");

async function sendData(event) {
  event.preventDefault(); // evita envio padrão

  const inputs = document.querySelectorAll('[id^="form-field"]');
  const dataForSend = [];

  inputs.forEach((item) => {
    const id = item.id;
    const key = id.replace("form-field-", "");

    if (item.type === "file") {
      // Se houver arquivos, adiciona o primeiro (pode adaptar para múltiplos)
      if (item.files.length > 0) {
        dataForSend.push({
          key,
          value: item.files[0],
        });
      }
    } else if ("value" in item) {
      dataForSend.push({
        key,
        value: item.value,
      });
    }
  });
  console.log(dataForSend);
  const formData = new FormData();

  dataForSend.forEach((item) => {
    formData.append(item.key, item.value);
  });

  // Exemplo de envio com fetch
  const response = await fetch(
    "https://55ea-2804-8fdc-3014-c500-b77e-c4aa-2194-c982.ngrok-free.app/enviar",
    {
      method: "POST",
      body: formData,
    }
  );

  console.log("FormData enviado!", response);
}

form.addEventListener("submit", sendData);
