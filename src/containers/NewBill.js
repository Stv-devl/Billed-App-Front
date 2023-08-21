import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

//Bug n°3 here we fix the bug.If the user don't add a good format ("jpeg", "jpg", "png") so we have a message error and  When we add a image format who is not good we will have an error message and we empty fileInput. If format match we submit
export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    //input for get a new bill
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    this.fileInput = this.document.querySelector(`input[data-testid="file"]`);
    this.fileInput.addEventListener("change", this.handleChangeFile);
    this.sendPictures = this.document.getElementById("sendPictures"); //Bug N°3 => we get the id of the container to send picture for add a span with an error message
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = (e) => {
    e.preventDefault();
    /* const fileInput = document.querySelector(`input[data-testid="file"]`); //Bug N°3 =>add fileInput*/
    const file = this.fileInput.files[0]; //Bug N°3 => change file with fileInput
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    //Bug N°3 => get the document extension
    const fileExtension = filePath[2].split(".")[1];
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);
    // Bug N°3 =>check if we already have an error message
    const existingError = document.querySelector("span");
    // Bug N°3 => check if the extension is compatible
    if (["jpeg", "jpg", "png"].includes(fileExtension)) {
      if (existingError) {
        existingError.remove(); //remove error message if we have an error before
      }
      this.store
        .bills()
        .create({
          data: formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          this.billId = key;
          this.fileUrl = fileUrl;
          this.fileName = fileName;
        })
        .catch((error) => console.error(error));
    } else {
      //if not we change the value of fileInput and add the error message
      this.fileInput.value = "";
      if (existingError) {
        existingError.remove(); //remove error message
      }
      this.displayErrorMessage();
    }
  };

  //bug n°3 => display error message if the image is not match
  displayErrorMessage() {
    const error = document.createElement("span");
    error.textContent = "Veuillez choisir un fichier jpg, jpeg ou png";
    Object.assign(error.style, {
      display: "block",
      color: "red",
      fontWeight: "500",
      marginTop: "10px",
    });
    this.sendPictures.appendChild(error);
  }

  handleSubmit = (e) => {
    e.preventDefault();
    console.log(
      'e.target.querySelector(`input[data-testid="datepicker"]`).value',
      e.target.querySelector(`input[data-testid="datepicker"]`).value
    );
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
