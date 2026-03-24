import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const ApiRegisterModule = buildModule("MyContractModule", (m) => {
  const apiRegistry = m.contract("APIRegistry")

  return { apiRegistry }
})

export default ApiRegisterModule