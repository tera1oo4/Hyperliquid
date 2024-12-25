import inquirer from "inquirer"

export const entryPoint = async () => {
    const questions = [
        {
            name: "choice",
            type: "list",
            message: "Действие:",
            choices: [
                {
                    name: "Faucet",
                    value: "Faucet",
                },
                {
                    name: "Deposit",
                    value: "Deposit",
                },
                {
                    name: "Send",
                    value: "Send",
                },
            ],
            loop: false,
        },
    ]

    const answers = await inquirer.prompt(questions)
    return answers.choice
}