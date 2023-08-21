/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom/extend-expect";
import userEvent from "@testing-library/user-event";

import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { ROUTES } from "../constants/routes.js";

import { localStorageMock } from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store";

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

    describe("Clicking on new button and eyes buttons; Filter bills with sort ", () => {
      let billsContainer;

      beforeEach(() => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        billsContainer = new Bills({
          document,
          onNavigate,
          store: mockedStore,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });
      });

      test("Clicking on the NewBill button should display the new bill form page", () => {
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

      test("Clicking on the eyes buttons should display the card with the justification image", () => {
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

      //change the test for verify sort() in getBills()
      test("Bills should be ordered from earliest to latest", async () => {
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
    test("fetches bills from mock API GET", async () => {
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

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: window.localStorage,
      });

      const billsList = await billsContainer.getBills();
      const numberOfBills = billsList.length;
      expect(numberOfBills).toBeGreaterThan(0);
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockedStore, "bills");
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
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", () => {
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        const errorMessage = screen.getAllByText(/Erreur 404/);
        expect(errorMessage).toBeTruthy();
      });
      test("fetches bills from an API and fails with 500 message error", () => {
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        console.log("html", document.body.innerHTML);
        const errorMessage = screen.getAllByText(/Erreur 500/);
        expect(errorMessage).toBeTruthy();
      });
    });
  });
});
