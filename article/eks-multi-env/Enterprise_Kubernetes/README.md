# Multi-environment Kubernetes Cluster
This project uses Infrastructure as Code (IAC) to set up a highly availabe kubernetes cluster across different environments. The environments are dev, staging and prod.

## Project Structure
```
📂 eks-new-setup
├── 📂 environments
│   ├── 📂 dev
│   ├── 📂 staging
│   ├── 📂 prod
│   │   ├── backend.tf             # 🔧 Terraform backend config (e.g., S3, DynamoDB)
│   │   ├── main.tf                # 🚀 Main infrastructure setup
│   │   ├── outputs.tf             # 📤 Outputs for Terraform
│   │   ├── providers.tf           # 🔌 Provider configurations (AWS, Kubernetes, etc.)
│   │   ├── terraform.tfvars       # 📄 Environment-specific variables
│   │   ├── variables.tf           # 🎛️ Input variables definition
│
├── 📂 modules
│   ├── 📂 eks                     # 🌍 EKS Cluster module
│   │   ├── main.tf                # 📜 Main EKS setup
│   │   ├── nodes.tf               # 🖥️ Worker nodes configuration
│   │   ├── outputs.tf             # 📤 Module outputs
│   │   ├── rbac.tf                # 🛡️ Kubernetes RBAC configuration
│   │   ├── variables.tf           # 🎚️ Input variables for the EKS module
│   │
│   ├── 📂 iam                     # 🔑 IAM Module (User, Roles, Policies)
│   │   ├── 📂 group               # 👥 IAM Groups
│   │   ├── 📂 policy              # 📜 IAM Policies
│   │   ├── 📂 role                # 🔄 IAM Roles
│   │   ├── 📂 user                # 👤 IAM Users
│   │
│   ├── 📂 vpc                     # 🌐 VPC Module (Networking)
│
├── 📂 policies                    # 🔏 Custom Policies (JSON/YAML)
├── 📂 templates                   # 🏗️ Cloud-init or Helm chart templates
├── README.md                       # 📖 Project documentation
```
Each environment folder is like a playground where you can manage the terraform modules to deploy resources to that environment. You will provide the values to the variables and apply the terraform config in the environment folder.

## State Management with S3
State management in Terraform involves tracking infrastructure resources and their metadata in a state file (terraform.tfstate). State locking prevents multiple users from modifying the same Terraform state simultaneously, avoiding conflicts and corruption.

- You have to manually create the bucket and dynamodb table for remote locking. Optionally, you can use `use_lockfile = true` within your local environment.

## Setting up Providers.tf
`providers.tf` is a Terraform configuration file where you define and configure providers. - A provider is simply a plugin that allows Terraform to interact with external systems or deploy external resources such as AWS, GCP, helm, kubernetes. The `required providers` block specify provider version and the individual `provider` block defines the settings for the `provider`.

- The `default_tags` ensure that all resource created by AWS receives the same tag. This prevents repetitive tagging of resources and easier cost tracking as this resources can be filtered using these tags under `cost explorer`.

## Setting up VPC module
1. `main.tf`: The VPC resource and local variables are defined here.

2. `internet-gw.tf`: The internet gateway is defined here and attached to the VPC using the vpc id. The tag `"kubernetes.io/cluster/${local.cluster-name}" = "owned"` is not required for internet gateway. EKS uses to automatically detect and identify subnets to deploy AWS resouces like load balancers to them.

3. `Subnets.tf`: You can go to the aws vpc console and enter one of the CIDR block from RFC 1918, include the number of desired subnets and it will automatically provide you with CIDR blocks for the subnets.
    - Create the subnets using `count` to iterate. Two public subnets and two private subnets.

4. `nat-gw.tf`: This deploys the nat gateway and attaches the elastic IP to it. Nat gateway requires eip and must be placed in a public subnet that has route to internet (igw is attached). The eip depends on the igw.

5. `routes.tf`: This configures route to internet for the public and private subnet. 
    - Create a private route table that uses nat gateway to route traffic to internet.
    - Create a public route table that uses igw gateway to route traffic to internet.

6. `outputs.tf`: 
    - create an output for the private subnets id so they can be referenced in the eks module.

## Setting up EKS
EKS requires the following IAM role policies
- `AmazonEKSClusterPolicy`: AWS to manage and operate the EKS control plane
- `AmazonEKSWorkerNodePolicy`: allows worker nodes to
    - Communicate with the EKS API server.
    - Register themselves with the cluster.
    - Access Amazon EC2 for node management (e.g., metadata, autoscaling).
- `AmazonEKS_CNI_Policy`: 
    - Allows worker nodes to assign and manage secondary IP addresses for Pods.
    - Enables communication between Pods and AWS networking.
- `AmazonEC2ContainerRegistryReadOnly`:
  - Pull container images from Amazon Elastic Container Registry (ECR).
  - Read metadata about images stored in ECR.
_Note: OIDC provider identity is only required for kubernetes pods to interact with aws services using IAM and SA_

1. `main.tf`
    - Create the IAM role for the eks cluster that ensure eks can assume the role.
    - Attach the `AmazonEKSClusterPolicy`to the role. It grants required permission to EKS to interact with AWS and create resources.
    - Create the eks cluster with the right configs.
    - The `private_subnet_ids` for the vpc_config is fetched from vpc module
    - Ensure to add `bootstrap_cluster_creator_admin_permissions = true` to grant terraform user admin privileges to deploy helm resources, kubernetes raw yaml etc.
    - The `authentication_mode = "API"` allows you users to authenticate via IAM and API requests without needing to manually update aws-auth unlke the `CONFIGMAP` option.


2. `nodes.tf`:
    - create the IAM role for the nodes (general and spot) and attach the necessary policies
    - Add taints to the spot node groups for scheduling interruptible workloads.

- _Confirm the current aws user: `aws sts get-caller-identity`_
- _Connect to the cluster with current account: `aws eks update-kubeconfig --region us-east-1 --name prod-cluster`_
- _Configure a profile account: `aws configure --profile <iam_user>`. Then provide the keys to authenticate_
- _Connect to the cluster with a profile: `aws eks update-kubeconfig --region us-east-1 --name prod-cluster --profile <iam_user>`_
- _Confirm admin privileges: `kubectl auth can-i "*" "*"`_
- _Confirm you can assume role: `aws sts assume-role --role-arn arn:aws:iam::<account-id>:role/<admin-role-name> --role-session-name eks-admin --profile drintech`
- _To access eks with IAM role, create another AWS profile: `vim ~/.aws/config`. Include the role ARN to assume and the source profile it should use._
    ```
    [profile eks-profile]
    role_arn = arn:aws:iam::<account_id>:role/<role_name>
    source_profile = <iam_user>
    ```
- _Access eks with the new role profile e.g (`eks-profile`): `aws eks update-kubeconfig --region us-east-1 --name prod-cluster --profile eks-profile`_
- _Confirm the correct profile is used to access eks: ` kubectl config view --minify`_

3. `rbac.tf`: This uses ClusterRole/Role and ClusterRoleBinding/RoleBinding to define permissions to resources in eks cluster and bind to identities such as user, group or service account. Role is **namespace scoped** while ClusterRole is **cluster wide**. Kubernetes organizes its resources into API groups. 

- create the `dev-team` namespace 
- create the `dev-team-role` and grant specific permissions on specific resources
- create  `dev-team-role-binding` to bind the role to RBAC API group `dev-team `. If the name of the group matches the name of IAM group, the IAM group is auto bind to the RBAC group.

- For the Cluster wide access for manager and devops team, use the default ClusterRole but create an RBAC API group. Kubernetes doesn't allow usage of the default one and we can directly create an RBAC API group that matches our IAM `admin` group.
- Create a ClusterRoleBinding. The ClusterRoleBinding creates the RBAC API group and binds it to the default ClusterRole.
- Set up the IAM users, roles and groups(`admin` and `dev-team`). 

## Setting up IAM.
This folder include configs to set up IAM user, role, policy and group using terraform official modules. Ensure the variables defined in these modules `variables.tf` are also defined in the environment `variables.tf`
1. `user`: This module is used to create user. By default variables, you can't create access keys. Only passwords allowed.
  - It provides the following output: `iam_user_name` and iam_user `policy_arns`. These will be used to add the users to groups.
2. `groups`: This module is used to set up the groups and attach users and policies to them. 
3. `role`: This module is used to set up the roles and attach policies and trusted_roles_arns(identity that assumes the role). `trusted_roles_arns` is usually set to `["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]` which means any IAM user or role in the same AWS account can assume this role.

### Settting Policies 
This folder contain the policies used to set up IAM.
- `eks-admin-access.json`: This grants admin access to EKS. This is attached to the `admin` role. 
- `eks-devteam-access.json`: This grants access to `describe` and `list` clusters within the AWS account. This is attached to the `dev-team` role. 
### Setting Template
This folder include the policy templates that allows the IAM users to assume the eks access roles. This template allows us to dynamically pass the arn of the roles to be assumed to this policy.
- `assume-eks-admin-iam-policy.tpl`: allows iam admin user to assume admin eks role. This policy is attached to the iam admin group
- `assume-eks-dev-team-iam-policy.tpl`: allows iam dev-team user to assume dev-team eks role. This policy is attached to the iam dev-team group.

### Final Setup with IAM modules.
In `environments/dev` main.tf, we'll create `dev-team` users, group, roles, policies and create `admin` users, group, roles and policies.
- The IAM users are attached to the group. 
- The policy to be able to assume eks admin role are attached to the groups. (e.g `allow_assume_eks_admins_iam_policy`). The policy include the arn of the role to be assumed which is provided through the template.
- The eks access policy `admin_iam_policy` is created and attached to the eks admin role.
- Finally, the eks admin role is binded to the kubernetes `my-admin` group. Admin user can now securely acccess all resources in the clusters as defined in `module/eks/rbac.tf` through the admin role.
- The same explanation applies for the `dev-team`.

