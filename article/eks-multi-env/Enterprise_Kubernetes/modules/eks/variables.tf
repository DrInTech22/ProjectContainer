variable "cluster-name" {}
variable "endpoint-private-access" {
    type        = bool
}
variable "endpoint-public-access" {
    type        = bool
}
variable "private_subnet_ids" {
    type        = list(string)
}
variable "eks-version" {}
variable "desired_spot_nodes" {
    type        = number
}
variable "max_spot_nodes" {
    type        = number
}
variable "min_spot_nodes" {
    type        = number
}
variable "desired_general_nodes" {
    type        = number
}
variable "max_general_nodes" {
    type        = number
}
variable "min_general_nodes" {
    type        = number
}  
variable "general_instance_types" {
    type        = list(string)
}
variable "spot_instance_types" {
    type        = list(string)
}

    