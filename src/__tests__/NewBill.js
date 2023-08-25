/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom/extend-expect";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import router from "../app/Router.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    test("Then newBill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const emailIcon = screen.getByTestId("icon-mail");
      expect(emailIcon).toHaveClass("active-icon");
    });
    test("Then newBill form should be displayed", async () => {
      document.body.innerHTML = NewBillUI();
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });

    describe("When I send a wrong image format (not to be jpg, jpeg, png)", () => {
      test("then should have an error message", async () => {
        document.body.innerHTML = NewBillUI();
        const newbill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.spyOn(newbill, "handleChangeFile");

        const fileInput = screen.getByTestId("file");
        const file = new File(["file"], "example.pmg", {
          type: "image/pmg",
        });

        fileInput.addEventListener("change", handleChangeFile);
        userEvent.upload(fileInput, file);

        const errorMessage = await screen.findByTestId("error-message");

        expect(handleChangeFile).toHaveBeenCalled();
        expect(errorMessage).toHaveTextContent(
          "Veuillez choisir un fichier jpg, jpeg ou png"
        );
      });
    });

    describe("When I send a good image format (jpg, jpeg, png)", () => {
      test("then should not have an error message, name of image should be displayed", async () => {
        document.body.innerHTML = NewBillUI();

        const newbill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.spyOn(newbill, "handleChangeFile");

        const fileInput = screen.getByTestId("file");
        const file = new File(["file"], "example.jpg", {
          type: "image/jpg",
        });

        fileInput.addEventListener("change", handleChangeFile);
        userEvent.upload(fileInput, file);

        const errorMessage = screen.queryByTestId("error-message"); //will be null

        expect(handleChangeFile).toHaveBeenCalled();
        expect(fileInput.files[0]).toStrictEqual(file);
        expect(errorMessage).toBeNull();
      });
    });
  });
});

//test d'intégration POST
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    describe("When I submit the form", () => {
      test("Then we launch handleSubmit and send new bill data to updateBill ", async () => {
        const onNavigate = (pathname) => {
          window.location.innerHTML = ROUTES({ pathname });
        };

        document.body.innerHTML = NewBillUI();

        const newbill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleSubmit = jest.spyOn(newbill, "handleSubmit");
        const updateBill = jest.spyOn(newbill, "updateBill");

        const getMockedList = await mockStore.bills().list();
        const MockedList = getMockedList[0];

        newbill.updateBill(MockedList); //we simulate the new bill in the updateBill methode

        const submitButton = screen.getByTestId("form-new-bill");
        submitButton.addEventListener("click", handleSubmit);
        userEvent.click(submitButton);

        expect(handleSubmit).toHaveBeenCalled(); //submit called
        expect(updateBill).toHaveBeenCalledWith(
          expect.objectContaining(MockedList) //we call updateBill with the new bill data
        );
      });
      test("Then it fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 404")),
        }));
        onNavigate(ROUTES_PATH.Bills);
        const message = await screen.findByText(/Erreur 404/);
        expect(message).toBeInTheDocument();
      });
      test("Then it fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 500")),
        }));
        onNavigate(ROUTES_PATH.Bills);
        const message = await screen.findByText(/Erreur 500/);
        expect(message).toBeInTheDocument();
      });
    });
  });
});
