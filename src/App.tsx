import React from "react";

import Address from "@/components/Address/Address";
import AddressBook from "@/components/AddressBook/AddressBook";
import Button from "@/components/Button/Button";
import InputText from "@/components/InputText/InputText";
import Radio from "@/components/Radio/Radio";
import Section from "@/components/Section/Section";
import useAddressBook from "@/hooks/useAddressBook";
import Form from "@/components/Form/Form";
import ErrorMessage from "@/components/ErrorMessage/ErrorMessage";
// import styles from "./App.module.css";
import { Address as AddressType } from "./types";
import transformAddress, { RawAddressModel } from "./core/models/address";

function useFormFields<T extends Record<string, string | boolean>>(
  initialFieldValues: T
) {
  const [formFields, setFormFields] = React.useState<T>(initialFieldValues);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.currentTarget;
    const name = target.name as keyof T;

    if (target instanceof HTMLInputElement) {
      if (target.type === "checkbox") {
        setFormFields(
          (prev) =>
            ({
              ...prev,
              [name]: target.checked,
            } as T)
        );
        return;
      }

      if (target.type === "radio") {
        setFormFields(
          (prev) =>
            ({
              ...prev,
              [name]: target.value,
            } as T)
        );
        return;
      }
    }

    setFormFields(
      (prev) =>
        ({
          ...prev,
          [name]: target.value,
        } as T)
    );
  };

  const resetFields = () => {
    setFormFields(initialFieldValues);
  };

  return { formFields, handleChange, resetFields };
}

function App() {
  /**
   * Form fields states
   * TODO: Write a custom hook to set form fields in a more generic way:
   * - Hook must expose an onChange handler to be used by all <InputText /> and <Radio /> components
   * - Hook must expose all text form field values, like so: { postCode: '', houseNumber: '', ...etc }
   * - Remove all individual React.useState
   * - Remove all individual onChange handlers, like handlePostCodeChange for example
   */

  const { formFields, handleChange, resetFields } = useFormFields({
    postCode: "",
    houseNumber: "",
    firstName: "",
    lastName: "",
    selectedAddress: "",
  });

  const [loading, setLoading] = React.useState(false);

  const BASE_API_URL = `${process.env.NEXT_PUBLIC_URL}/api/getAddresses`;

  /**
   * Results states
   */
  const [error, setError] = React.useState<undefined | string>(undefined);
  const [addresses, setAddresses] = React.useState<AddressType[]>([]);
  /**
   * Redux actions
   */
  const { addAddress } = useAddressBook();

  /**
   * Text fields onChange handlers
   */

  /** TODO: Fetch addresses based on houseNumber and postCode using the local BE api
   * - Example URL of API: ${process.env.NEXT_PUBLIC_URL}/api/getAddresses?postcode=1345&streetnumber=350
   * - Ensure you provide a BASE URL for api endpoint for grading purposes!
   * - Handle errors if they occur
   * - Handle successful response by updating the `addresses` in the state using `setAddresses`
   * - Make sure to add the houseNumber to each found address in the response using `transformAddress()` function
   * - Ensure to clear previous search results on each click
   * - Bonus: Add a loading state in the UI while fetching addresses
   */
  const handleAddressSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    setAddresses([]);

    if (!BASE_API_URL) {
      setError("BASE API URL is not defined");
      return;
    }
    if (
      !formFields.postCode ||
      !formFields.postCode.trim() ||
      !formFields.houseNumber ||
      !formFields.houseNumber.trim()
    ) {
      setError("Post code and house number are mandatory fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${BASE_API_URL}?postcode=${encodeURIComponent(
          formFields.postCode
        )}&streetnumber=${encodeURIComponent(formFields.houseNumber)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }

      const data = await response.json();
      if (!data || !data.details) {
        throw new Error("Invalid response format");
      }
      if (!Array.isArray(data.details)) {
        throw new Error("Addresses should be an array");
      }
      if (data.details.length === 0) {
        setError("No addresses found for the given postcode and house number");
        setAddresses([]);
        return;
      }
      // Transform addresses and set them in the state
      // Ensure to add the houseNumber to each address
      // using the transformAddress function
      // This function should return an Address object with the houseNumber included
      // and the id generated from the address properties
      setAddresses(
        data.details.map((address: RawAddressModel) => {
          return transformAddress({
            ...address,
            houseNumber: address.houseNumber,
          });
        })
      );
      setError(undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  /** TODO: Add basic validation to ensure first name and last name fields aren't empty
   * Use the following error message setError("First name and last name fields mandatory!")
   */
  const handlePersonSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    if (!formFields.selectedAddress || !addresses.length) {
      setError(
        "No address selected, try to select an address or find one if you haven't"
      );
      return;
    }

    const foundAddress = addresses.find(
      (address) => address.id === formFields.selectedAddress
    );

    if (!foundAddress) {
      setError("Selected address not found");
      return;
    }

    if (
      !formFields.firstName ||
      !formFields.firstName.trim() ||
      !formFields.lastName ||
      !formFields.lastName.trim()
    ) {
      setError("First name and last name fields mandatory!");
      return;
    }

    addAddress({
      ...foundAddress,
      firstName: formFields.firstName,
      lastName: formFields.lastName,
    });
  };

  const handleClearFields = () => {
    resetFields();
    setAddresses([]);
    setError(undefined);
  };

  return (
    <main>
      <Section>
        <h1>
          Create your own address book!
          <br />
          <small>
            Enter an address by postcode add personal info and done! 👏
          </small>
        </h1>
        {/* TODO: Create generic <Form /> component to display form rows, legend and a submit button  */}
        <Form
          label="🏠 Find an address"
          submitText="Find"
          formEntries={[
            {
              name: "postCode",
              placeholder: "Post Code",
              extraProps: {
                value: formFields.postCode,
                onChange: handleChange,
              },
            },
            {
              name: "houseNumber",
              placeholder: "House number",
              extraProps: {
                value: formFields.houseNumber,
                onChange: handleChange,
              },
            },
          ]}
          onFormSubmit={handleAddressSubmit}
          loading={loading}
        />
        {addresses.length > 0 &&
          addresses.map((address) => {
            return (
              <Radio
                name="selectedAddress"
                id={address.id}
                key={address.id}
                onChange={handleChange}
              >
                <Address {...address} />
              </Radio>
            );
          })}
        {/* TODO: Create generic <Form /> component to display form rows, legend and a submit button  */}
        {formFields.selectedAddress && (
          <Form
            label="✏️ Add personal info to address"
            submitText="Add to addressbook"
            formEntries={[
              {
                name: "firstName",
                placeholder: "First name",
                extraProps: {
                  value: formFields.firstName,
                  onChange: handleChange,
                },
              },
              {
                name: "lastName",
                placeholder: "Last name",
                extraProps: {
                  value: formFields.lastName,
                  onChange: handleChange,
                },
              },
            ]}
            onFormSubmit={handlePersonSubmit}
            loading={loading}
          />
        )}

        {/* TODO: Create an <ErrorMessage /> component for displaying an error message */}
        {error && <ErrorMessage error={error} />}

        {/* TODO: Add a button to clear all form fields. 
        Button must look different from the default primary button, see design. 
        Button text name must be "Clear all fields"
        On Click, it must clear all form fields, remove all search results and clear all prior
        error messages
        */}
        <Button type="reset" variant="secondary" onClick={handleClearFields}>
          Clear all fields
        </Button>
      </Section>

      <Section variant="dark">
        <AddressBook />
      </Section>
    </main>
  );
}

export default App;
