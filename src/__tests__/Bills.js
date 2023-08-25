/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom/extend-expect";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import router from "../app/Router.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/Store", () => mockStore);

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
      expect(windowIcon).toHaveClass("active-icon"); //check with class
    });

    describe("When Clicking on new button and eyes buttons; When I Filter bills with sort ", () => {
      let billsContainer;

      beforeEach(() => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        billsContainer = new Bills({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        document.body.innerHTML = BillsUI({ data: bills });
      });

      test("Then clicking on the NewBill button should display the new bill form page", () => {
        const handleClickNewBill1 = jest.spyOn(
          billsContainer,
          "handleClickNewBill"
        );
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        buttonNewBill.addEventListener("click", handleClickNewBill1);
        userEvent.click(buttonNewBill);

        const newBillForm = screen.getByTestId(`form-new-bill`);

        expect(handleClickNewBill1).toHaveBeenCalled();
        expect(newBillForm).toBeTruthy();
      });

      test("Then clicking on the eyes buttons should display the card with the justification image", () => {
        $.fn.modal = jest.fn();

        const icon = screen.getAllByTestId("icon-eye")[0];
        const handleClickIconEye = jest.fn(() =>
          billsContainer.handleClickIconEye(icon)
        );

        icon.addEventListener("click", handleClickIconEye);
        userEvent.click(icon);

        const modaleFile = document.getElementById("modaleFile");

        expect(handleClickIconEye).toHaveBeenCalled();
        expect(screen.getByText("Justificatif"));
        expect(modaleFile).toBeTruthy();
      });

      //change the test for verify sort() in getBills()
      test("then bills should be ordered from earliest to latest", async () => {
        const billsList = await billsContainer.getBills();
        const antiChrono = (a, b) => (a < b ? 1 : -1);
        const datesListe = billsList.map((bill) => bill.date);
        const datesSorted = [...datesListe].sort(antiChrono);
        expect(datesSorted).toEqual(datesListe);
      });
    });
  });
});

//test d'intégration GET Bills
describe("Given I am a user connected as employee", () => {
  describe("When I navigate in Bills page ", () => {
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

    test("then fetches bills from mock API GET", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const billsList = await billsContainer.getBills();
      const numberOfBills = billsList.length;
      expect(numberOfBills).toBeGreaterThan(0);
    });

    describe("When an error occurs on API", () => {
      test("then fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 404")),
        }));
        window.onNavigate(ROUTES_PATH.Bills);
        const message = await screen.findByText(/Erreur 404/);
        expect(message).toBeInTheDocument();
      });
      test("then fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 500")),
        }));
        window.onNavigate(ROUTES_PATH.Bills);
        const message = await screen.findByText(/Erreur 500/);
        expect(message).toBeInTheDocument();
      });
    });
  });
});
