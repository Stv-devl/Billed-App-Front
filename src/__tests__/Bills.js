/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { ROUTES } from "../constants/routes.js";
import router from "../app/Router.js";

import { localStorageMock } from "../__mocks__/localStorage.js";
import mockedBills from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //if the class "active-icon" is activate so its highlighted
      expect(windowIcon).toHaveClass("active-icon");
    });

    describe("clicks event: newbutton, eye button; Filter with sort ", () => {
      let billsContainer;

      beforeEach(() => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        billsContainer = new Bills({
          document,
          onNavigate,
          store: mockedBills,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });
      });

      describe("When I click on the NewBill button", () => {
        test("Then the new bill form page should be rendered", () => {
          const handleClickNewBill1 = jest.fn(() =>
            billsContainer.handleClickNewBill()
          );

          const buttonNewBill = screen.getByTestId("btn-new-bill");
          buttonNewBill.addEventListener("click", handleClickNewBill1);
          userEvent.click(buttonNewBill);

          const newBillForm = screen.getByTestId(`form-new-bill`);

          expect(handleClickNewBill1).toHaveBeenCalled();
          expect(newBillForm).toBeTruthy();
        });
      });

      describe("When I click on the eye button", () => {
        test("Then the card with the justification should appear", () => {
          $.fn.modal = jest.fn();

          const icon = screen.getAllByTestId("icon-eye")[0];
          const handleClickIconEye = jest.fn(() =>
            billsContainer.handleClickIconEye(icon)
          );

          icon.addEventListener("click", handleClickIconEye);
          userEvent.click(icon);

          const modaleFile = document.getElementById("modaleFile");

          expect(handleClickIconEye).toHaveBeenCalled();
          expect(modaleFile).toBeTruthy();
        });
      });

      //change the test for verifie sort() in getBills()
      test("Then bills should be ordered from earliest to latest", async () => {
        const billsList = await billsContainer.getBills();
        const antiChrono = (a, b) => (a < b ? 1 : -1);
        const datesListe = billsList.map((bill) => bill.date);
        const datesSorted = [...datesListe].sort(antiChrono);
        expect(datesSorted).toEqual(datesListe);
      });
    });
  });
});

// test d'intégration GET Bills
describe("Given I am a user connected as employee", () => {
  describe("When I navigate in Bills page ", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    });
    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
    });
  });
});

//tester erreurs 404 et 500
