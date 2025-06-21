const form = document.querySelector(
  "form#formulario_solicitacao_documentos_escolas"
);

async function sendData(event) {
  event.preventDefault();

  const inputs = document.querySelectorAll('[id^="form-field"]');
  const dataForSend = [];

  inputs.forEach((el) => {
    const id = el.id;
    const key = id.replace("form-field-", "");

    if (el.type === "file") {
      if (el.files.length > 0) {
        dataForSend.push({
          key,
          value: el.files[0],
        });
      }
    } else if ("value" in el) {
      dataForSend.push({
        key,
        value: el.value,
      });
    }
  });

  console.log(dataForSend);

  const emailItem = dataForSend.find((item) => item.key === "email");

  const parte1 = [
    emailItem,
    ...dataForSend.slice(0, 3).filter((item) => item.key !== "email"),
  ];
  const parte2 = [emailItem, ...dataForSend.slice(3, 6)];
  const parte3 = [emailItem, ...dataForSend.slice(6, 9)];

  console.log("Parte 1:", parte1);
  console.log("Parte 2:", parte2);
  console.log("Parte 3:", parte3);

  const sendDataOne = new FormData();
  const sendDataTwo = new FormData();
  const sendDataThree = new FormData();

  parte1.forEach((item) => {
    sendDataOne.append(item.key.toLowerCase(), item.value);
  });
  parte2.forEach((item) => {
    sendDataTwo.append(item.key.toLowerCase(), item.value);
  });
  parte3.forEach((item) => {
    sendDataThree.append(item.key.toLowerCase(), item.value);
  });

  // Exemplo de envio com fetch
  const response = await fetch(
    "https://server-google-drive.vercel.app//api/escola",
    {
      method: "POST",
      body: sendDataOne,
    }
  );

  const response1 = await fetch(
    "https://server-google-drive.vercel.app//api/escola-part-two",
    {
      method: "POST",
      body: sendDataTwo,
    }
  );

  const response2 = await fetch(
    "https://server-google-drive.vercel.app//api/escola-part-three",
    {
      method: "POST",
      body: sendDataThree,
    }
  );

  console.log("FormData enviado!", response);
  console.log("FormData enviado! 1", response1);
  console.log("FormData enviado! 2", response2);
}

form.addEventListener("submit", sendData);
