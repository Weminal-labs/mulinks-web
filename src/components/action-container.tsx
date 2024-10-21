import { BaseButtonProps } from "@/components/ui/inputs/types";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TransactionHash } from "@/components/TransactionHash";
import { useToast } from "@/hooks/use-toast";
import { ActionLayout, LayoutProps } from "@/components/ActionLayout";
import {
  type BaseError,
  useWaitForTransactionReceipt,
  useWriteContract,
  useAccount,
  useChainId
} from "wagmi";

import {
  BLOCK_EXPLORER_OPAL,
  BLOCK_EXPLORER_QUARTZ,
  BLOCK_EXPLORER_UNIQUE,
  CHAINID,
  CONTRACT_ADDRESS_OPAL,
  CONTRACT_ADDRESS_QUARTZ,
  CONTRACT_ADDRESS_UNIQUE,
} from "./contract";
import { abi } from "./abi";

const ActionContainer = () => {
  const pathname = usePathname();
  const [apiAction, setApiAction] = useState("");
  const [addressFromAction, setAddressFromAction] = useState("");
  const { toast } = useToast();
  const [layoutProps, setLayoutProps] = useState<LayoutProps | null>(null);
  const account = useAccount();

  let chainId = useChainId();
  let contractAddress: any;
  switch (chainId) {

    case CHAINID.UNIQUE:
      contractAddress = CONTRACT_ADDRESS_UNIQUE;
      break;

    case CHAINID.QUARTZ:
      contractAddress = CONTRACT_ADDRESS_QUARTZ;
      break;
    case CHAINID.OPAL:
      contractAddress = CONTRACT_ADDRESS_OPAL;
      break;
    default:
      break;
  }
  let blockexplorer;
  switch (chainId) {

    case CHAINID.UNIQUE:
      blockexplorer = BLOCK_EXPLORER_UNIQUE;
      break;

    case CHAINID.QUARTZ:
      blockexplorer = BLOCK_EXPLORER_QUARTZ;
      break;
    case CHAINID.OPAL:
      blockexplorer = BLOCK_EXPLORER_OPAL;
      break;
    default:
      break;
  }
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  // https://opal.subscan.io/tx/

  interface ActionWithParameters {
    href: string;
    label: string;
    parameters: Array<{
      name: string;
      label: string;
      required: boolean;
    }>;
  }

  interface ActionWithoutParameters {
    href: string;
    label: string;
    parameters?: undefined;
  }

  type Action = ActionWithParameters | ActionWithoutParameters;

  const isActionWithParameters = (
    action: Action
  ): action is ActionWithParameters => {
    return "parameters" in action && action.parameters !== undefined;
  };

  const createButton = (action: ActionWithParameters): BaseButtonProps => ({
    text: action.label,
    onClick: () => handleActionClick(action),
  });

  const handleActionClick = async (action: Action) => {
    try {
      let url = action.href;

      if (isActionWithParameters(action)) {
        const params = action.parameters.reduce((acc: any, param) => {
          const inputElement = document.querySelector(
            `[name="amount-value"]`
          ) as HTMLInputElement;
          const value = inputElement?.value;

          if (param.required && !value) {
            alert(`The ${param.label} is required.`);
            return acc;
          }

          if (value) {
            acc[param.name] = encodeURIComponent(value);
          }

          return acc;
        }, {});

        Object.keys(params).forEach((key) => {
          url = url.replace(`{${key}}`, params[key]);
        });
      }

      const body = {
        address: account.address // Sử dụng trực tiếp account.address
      };

      const response = await fetch("http://localhost:80/api/actions/mint-nft/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      const { transaction, message } = result;

      await writeContract({
        abi,
        address: contractAddress,
        functionName: "safeMint",
        args: [`0x${account.address?.slice(2)}`, response.url.toString()], // Pass the 'to' and 'uri' values as arguments
      });

      toast({
        title: "Success",
        description: message || "Transaction submitted successfully",
      });
    } catch (error) {
      console.error("Error handling action click:", error);
      toast({
        title: "Error",
        variant: "destructive",
      });
    }
  };

  const mapApiResponseToLayoutProps = (
    apiResponse: any,
    baseUrl: string
  ): LayoutProps => {
    const actionsWithParameters = apiResponse.links.actions.filter(
      isActionWithParameters
    );

    const actionsWithoutParameters = apiResponse.links.actions.filter(
      (action: Action): action is ActionWithoutParameters =>
        !("parameters" in action) || action.parameters === undefined
    );

    return {
      stylePreset: "default",
      title: apiResponse.title,
      description: apiResponse.description.trim(),
      image: apiResponse.icon,
      type: "trusted",
      websiteUrl: baseUrl,
      websiteText: baseUrl,
      buttons: actionsWithoutParameters.map((action: any) => ({
        label: action.label,
        text: action.label,
        onClick: () => handleActionClick(action),
      })),
      inputs: actionsWithParameters.flatMap((action: any) =>
        action.parameters.map((param: any) => ({
          type: "text",
          name: param.name,
          placeholder: param.label,
          required: param.required,
          disabled: false,
          button: createButton(action),
        }))
      ),
    };
  };

  useEffect(() => {
    const parts = pathname.split("api-action=");
    if (parts.length > 1) {
      const decodedPath = decodeURIComponent(parts[1]);

      setApiAction(decodedPath);
    }
  }, [pathname]);

  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const response = await fetch(apiAction);
        const data = await response.json();
        const baseUrl = new URL(apiAction).origin;
        const mappedProps = mapApiResponseToLayoutProps(data, baseUrl);
        setLayoutProps(mappedProps);
      } catch (error) {
        console.error("Error fetching API data:", error);
      }
    };

    if (apiAction && account.address) {
      fetchApiData();
    }
  }, [apiAction, account.address]);

  useEffect(() => {
    if (account.address) {
      setAddressFromAction(account.address);
    }
  }, [account.address]);

  if (!layoutProps) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-2 py-4 md:px-8 dark:bg-black">
      <div className="w-full max-w-md">
        <ActionLayout {...layoutProps} />
      </div>
    </main>
  );
};

export default ActionContainer;
