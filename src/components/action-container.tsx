import { BaseButtonProps } from "@/components/ui/inputs/types";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { TransactionHash } from "@/components/TransactionHash";
import { useToast } from "@/hooks/use-toast";
import { ActionLayout, LayoutProps } from "@/components/ActionLayout";

const ActionContainer = () => {
  const pathname = usePathname();
  const [apiAction, setApiAction] = useState("");
  const [addressFromAction, setAddressFromAction] = useState("");
  const { toast } = useToast();
  const [layoutProps, setLayoutProps] = useState<LayoutProps | null>(null);
  // const { account, network, signAndSubmitTransaction } = useWallet();

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
    // console.log("account :", account);
    // if (!account) {
    //   toast({
    //     title: "Error",
    //     description: "Please connect your wallet before making a transaction.",
    //     variant: "destructive",
    //   });
    //   return;
    // }
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
        // fromAddress: account.address as string,
        toAddress: addressFromAction as string,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const result = await response.json();
      const { transaction, message } = result;

      // const pendingTransaction = await signAndSubmitTransaction(transaction);
      // await aptosClient(network).waitForTransaction({
      //   transactionHash: pendingTransaction.hash,
      // });

      toast({
        title: "Success",
        description: "Transaction submitted successfully",
        // <TransactionHash hash={pendingTransaction.hash} network={network} />
      });
    } catch (error) {
      console.error("Error handling action click:", error);
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
      console.log("decodedPath :", decodedPath);
      // tách ra để lấy link và address

      setApiAction(decodedPath);
      // setAddressFromAction(addressFromLink);
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

    fetchApiData();
  }, [apiAction]);

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
