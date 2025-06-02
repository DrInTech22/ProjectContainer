variable "cluster-name" {}
variable "vpc-cidr-block" {}
variable "igw-name" {}
variable "pub-cidr-block" {
  type = list(string)
}
variable "pri-cidr-block" {
  type = list(string)
}
variable "pub-sub-count" {}
variable "pri-sub-count" {}
variable "pub-az" {
    type = list(string)
}
variable "pri-az" {
    type = list(string)
}
variable "pub-sub-name" {}
variable "pri-sub-name" {}
variable "natgw-name" {}